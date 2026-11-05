import YahooFinance from "yahoo-finance2";
import type { ChartResultArrayQuote } from "yahoo-finance2/modules/chart";

interface Quote {
  symbol: string;
  close: number;
  currency: string;
}

export default class Finance {
  #client;
  readonly currency: string;

  private constructor(currency: string) {
    this.#client = new YahooFinance();
    this.currency = currency;
  }

  static connect(currency: string): Finance {
    return new Finance(currency);
  }

  async getPrices(
    symbols: string[],
    date: string,
  ): Promise<Map<string, number>> {
    const quotes = await Promise.all(
      symbols.map(async (symbol) => await this.getQuote(symbol, date)),
    );

    const exchangeRates = new Map<string, number>([[this.currency, 1]]);

    const currencies = [
      ...new Set(quotes.map((quote) => quote.currency)),
    ].filter((currency) => !exchangeRates.has(currency));

    await Promise.all(
      currencies.map(async (currency) => {
        const exchangeRate = await this.getExchangeRate(currency, date);

        exchangeRates.set(...exchangeRate);
      }),
    );

    const prices = quotes.map((quote): [string, number] => {
      const exchangeRate = exchangeRates.get(quote.currency);

      if (exchangeRate === undefined) {
        // Should always be false
        throw new Error(`Missing exchange rate for ${quote.currency}`);
      }

      return [quote.symbol, quote.close * exchangeRate];
    });

    return new Map(prices);
  }

  private async getQuote(
    symbol: string,
    date: string,
    interval: number = 5,
  ): Promise<Quote> {
    const to = Temporal.PlainDate.from(date).add({ days: 1 });
    const from = to.subtract({ days: interval });

    const data = await this.#client.chart(symbol, {
      period1: from.toString(),
      period2: to.toString(),
      interval: "1d",
    });

    const close = data.quotes.findLast(
      (quote): quote is ChartResultArrayQuote & { close: number } =>
        quote.close != null,
    )?.close;

    if (close === undefined) {
      throw Error(
        `No closing price found for ${symbol} in the interval ${from.toString()} - ${to.toString()}`,
      );
    }

    return { symbol, close, currency: data.meta.currency };
  }

  private async getExchangeRate(
    currency: string,
    date: string,
    interval: number = 5,
  ): Promise<[string, number]> {
    const to = Temporal.PlainDate.from(date).add({ days: 1 });
    const from = to.subtract({ days: interval });

    const data = await this.#client.chart(`${currency}${this.currency}=X`, {
      period1: from.toString(),
      period2: to.toString(),
      interval: "1d",
    });

    const close = data.quotes.findLast(
      (quote): quote is ChartResultArrayQuote & { close: number } =>
        quote.close != null,
    )?.close;

    if (close === undefined) {
      throw Error(
        `No closing price found for ${currency} in the interval ${from.toString()} - ${to.toString()}`,
      );
    }

    return [currency, close];
  }
}
