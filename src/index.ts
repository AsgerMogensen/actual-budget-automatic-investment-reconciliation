import { parseArgs } from "util";
import { ConfigSchema } from "./config";
import Finance from "./finance";
import Actual from "./actual";

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
  },
  strict: true,
  allowPositionals: true,
});

const date = values.date;

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

const balances = await actual.getBalances(accountIds, date);

await Promise.all(
  config.accounts.map(async (account) => {
    const id = account.id;

    const total = account.investments.reduce((total, current) => {
      const price = prices.get(current.symbol);

      if (price === undefined) {
        // Should always be false
        throw new Error(`Missing price for ${current.symbol}`);
      }

      return total + price * current.quantity;
    }, 0);

    const balance = balances.get(id);

    if (balance === undefined) {
      // Should always be false
      throw new Error(`Missing balance for ${id}`);
    }

    const difference = Actual.amountToInteger(total) - balance;

    await actual.addTransaction(id, date, difference);
  }),
);

await actual.disconnect();
