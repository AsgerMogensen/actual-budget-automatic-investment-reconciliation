import { parseArgs } from "util";
import { ConfigSchema } from "./config";
import Finance from "./finance";
import Actual from "./actual";

type ReconciliationPlan = {
  accountId: string;
  accountName?: string;
  date: string;
  target: number;
  balance: number;
  difference: number;
};

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    date: {
      type: "string",
      short: "d",
    },
    config: {
      type: "string",
      short: "c",
    },
    "dry-run": {
      type: "boolean",
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
});

const date = values.date;
const dryRun = values["dry-run"];

if (date === undefined) {
  throw Error("Please provide a date argument");
}

const file = Bun.file(values.config ?? "./config.json");
const json = await file.json();

const config = ConfigSchema.parse(json);

const symbols = [
  ...new Set(
    config.accounts.flatMap((account) =>
      account.investments.map((investment) => investment.symbol),
    ),
  ),
];

const accountIds = [...new Set(config.accounts.map((account) => account.id))];

const finance = Finance.connect(config.baseCurrency);

const prices = await finance.getPrices(symbols, date);

const actual = await Actual.connect(config.actual);

try {
  const balances = await actual.getBalances(accountIds, date);

  const plan: ReconciliationPlan[] = config.accounts.map((account) => {
    const id = account.id;
    const name = account.name;

    const totalInvestments = account.investments.reduce((total, current) => {
      const price = prices.get(current.symbol);

      if (price === undefined) {
        // Should always be false
        throw new Error(`Missing price for ${current.symbol}`);
      }

      return total + price * current.quantity;
    }, 0);

    const target = Actual.amountToInteger(totalInvestments + account.cash);
    const balance = balances.get(id);

    if (balance === undefined) {
      // Should always be false
      throw new Error(`Missing balance for ${id}`);
    }

    const difference = target - balance;

    return {
      accountId: id,
      accountName: name,
      date,
      target,
      balance,
      difference,
    };
  });

  plan.forEach((item) => {
    const { accountId, accountName, date, target, balance, difference } = item;

    console.info(
      `${date} ${accountName ?? accountId}: Target=${Actual.integerToAmount(target)}, Balance=${Actual.integerToAmount(balance)}, Difference=${Actual.integerToAmount(difference)}`,
    );
  });

  if (!dryRun) {
    await Promise.all(
      plan.map((item) =>
        actual.addTransaction(item.accountId, item.date, item.difference),
      ),
    );
  } else {
    console.info("Dry run: No transactions will be added.");
  }
} finally {
  await actual.disconnect();
}
