import api, { utils } from "@actual-app/api";
import type { ActualConfig } from "./config";

export default class Actual {
  readonly options: ActualConfig;

  private constructor(options: ActualConfig) {
    this.options = options;
  }

  static async connect(options: ActualConfig): Promise<Actual> {
    const actual = new Actual(options);

    await api.init({
      dataDir: options.dataDir,
      serverURL: options.serverUrl,
      password: options.password,
      verbose: false,
    });

    await api.downloadBudget(options.syncId);

    return actual;
  }

  async getBalances(
    accounts: string[],
    date: string,
  ): Promise<Map<string, number>> {
    const balances = new Map<string, number>(
      await Promise.all(
        accounts.map(async (account): Promise<[string, number]> => {
          const balance = await api.getAccountBalance(account, new Date(date));

          return [account, balance];
        }),
      ),
    );

    return balances;
  }

  async addTransaction(
    account: string,
    date: string,
    amount: number,
  ): Promise<void> {
    const transaction = {
      account,
      date,
      amount,
      notes: this.options.notes,
      category: this.options.category,
      cleared: true,
    };

    await api.addTransactions(account, [transaction]);
  }

  async getCategories() {
    return await api.getCategories();
  }

  static amountToInteger(amount: number): number {
    return utils.amountToInteger(amount);
  }

  static integerToAmount(amount: number): number {
    return utils.integerToAmount(amount);
  }

  async disconnect(): Promise<void> {
    await api.shutdown();
  }
}
