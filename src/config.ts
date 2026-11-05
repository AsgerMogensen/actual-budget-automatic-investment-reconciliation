import z from "zod";

const InvestmentSchema = z.object({
  name: z.string().optional().meta({
    description: "Display name for this investment.",
  }),
  symbol: z.string().meta({
    description:
      "Ticker symbol used to look up this investment’s price (e.g. AAPL).",
  }),
  quantity: z.number().meta({ description: "Number of units held." }),
});
export type Investment = z.infer<typeof InvestmentSchema>;

const AcountSchema = z.object({
  name: z.string().optional().meta({
    description: "Display name for this account.",
  }),
  id: z.string().meta({
    description:
      "Actual Budget account ID. Find it in the URL when the account is selected.",
  }),
  investments: z.array(InvestmentSchema),
  cash: z
    .number()
    .default(0)
    .meta({ description: "Cash balance for this account." }),
});

const ActualConfigSchema = z.object({
  dataDir: z.string().default("./cache").meta({
    description: "The directory to store locally cached budget files.",
  }),
  syncId: z.string().meta({
    description:
      "Actual Budget sync ID. Find it under Settings → Show advanced settings → Sync ID.",
  }),
  serverUrl: z
    .url()
    .meta({ description: "The URL of your Actual Budget server." }),
  password: z
    .string()
    .meta({ description: "The password of your Actual Budget server." }),
  notes: z
    .string()
    .optional()
    .meta({ description: "Notes added to reconciliation transactions." }),
  category: z.string().optional().meta({
    description:
      "Category ID to assign to reconciliation transactions. Use the provided script to find category IDs.",
  }),
});
export type ActualConfig = z.infer<typeof ActualConfigSchema>;

export const ConfigSchema = z.object({
  baseCurrency: z.string().meta({
    description:
      "Currency to use for investment totals. Prices in other currencies are converted to this currency.",
  }),
  actual: ActualConfigSchema,
  accounts: z.array(AcountSchema),
});
