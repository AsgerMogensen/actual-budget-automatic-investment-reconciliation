// Run `categories` to get the category ID's for configuration

import { parseArgs } from "node:util";
import { ConfigSchema } from "../config";
import Actual from "../actual";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    config: {
      type: "string",
      short: "c",
    },
  },
  strict: true,
  allowPositionals: true,
});

const file = Bun.file(values.config ?? "./config.json");
const json = await file.json();

const config = ConfigSchema.parse(json);

const actual = await Actual.connect(config.actual);

try {
  const categories = await actual.getCategories();

  categories.forEach((category) =>
    console.log(`${category.name}: ${category.id}`),
  );
} finally {
  await actual.disconnect();
}
