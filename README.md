# Actual Budget Automatic Investment Reconciliation

Reconciles investment account balances in Actual Budget using market prices retrieved from Yahoo Finance. For each configured account, it compares the value of its investments with the current Actual balance and adds a transaction for the difference.

## Setup

Install dependencies:

```sh
bun install
```

Edit `config.json` with your Actual server connection details, base currency, account IDs, and each account's investment ticker symbols and quantities. Keep your server password private.

## Configuration

### Top level

| Field          | Type   | Required | Description                                                                                     |
| -------------- | ------ | :------: | ----------------------------------------------------------------------------------------------- |
| `baseCurrency` | string |   Yes    | Currency used for investment totals. Prices in other currencies are converted to this currency. |
| `accounts`     | array  |   Yes    | List of accounts to reconcile. See [account configuration](#accounts)                           |
| `actual`       | object |   Yes    | See [Actual Budget configuration](#actual)                                                      |

### Actual Budget

| Field       | Type   | Required | Description                                                                           |
| ----------- | ------ | :------: | ------------------------------------------------------------------------------------- |
| `dataDir`   | string |    No    | Directory for locally cached budget files. Defaults to `./cache`.                     |
| `syncId`    | string |   Yes    | Actual Budget sync ID, found under **Settings → Show advanced settings → Sync ID**.   |
| `serverUrl` | URL    |   Yes    | URL of your Actual Budget server.                                                     |
| `password`  | string |   Yes    | Actual Budget server password.                                                        |
| `notes`     | string |    No    | Notes to add to reconciliation transactions.                                          |
| `category`  | string |    No    | Category ID to assign to reconciliation transactions. Get them via the Actual NPM API |

### Accounts

| Field         | Type   | Required | Description                                                                   |
| ------------- | ------ | :------: | ----------------------------------------------------------------------------- |
| `name`        | string |    No    | Display name for the account.                                                 |
| `id`          | string |   Yes    | Actual Budget account ID, available in the URL when the account is selected.  |
| `investments` | array  |   Yes    | Investments held in the account. See [investment configuration](#investments) |
| `cash`        | number |    No    | Cash balance for the account. Defaults to `0`                                 |

### Investments

| Field      | Type   | Required | Description                                                                  |
| ---------- | ------ | :------: | ---------------------------------------------------------------------------- |
| `name`     | string |    No    | Display name for the investment.                                             |
| `symbol`   | string |   Yes    | Yahoo Finance ticker symbol used to look up the price (for example, `AAPL`). |
| `quantity` | number |   Yes    | Number of units held.                                                        |

# Run the script

```sh
bun run reconcile --date YYYY-MM-DD
```
