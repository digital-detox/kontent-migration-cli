import { DeliveryClient, ContentItem } from "@kentico/kontent-delivery";
import path from "path";

require("dotenv").config({
  path: path.resolve(process.cwd(), "./.env")
});

export const deliveryClient = new DeliveryClient({
  projectId: process.env.PROJECT_ID,
  previewApiKey: process.env.PREVIEW_KEY,
  globalQueryConfig: {
    usePreviewMode: true
  }
});

export const getLatestMigration = async (): Promise<
  ContentItem | undefined
> => {
  const { items } = await deliveryClient
    .items()
    .type("migration")
    .limitParameter(1)
    .orderByDescending("elements.name")
    .toObservable()
    .toPromise();

  return items[0];
};

export const sanatiseCodename = (codename: string): string => {
  return path.basename(codename, ".js").replace(/\d*-/g, "").replace(/-/g, "_");
};

export const getLatestBatchMigrations = async (): Promise<string[]> => {
  let items;

  try {
    const { items: responseItems } = await deliveryClient
      .items()
      .type("migration")
      .toObservable()
      .toPromise();

    // @note: In theory this shouldn't be necessary, as the latest migration
    // should have the latest batch.
    items = [...responseItems].sort((a, b) => {
      return (
        parseFloat(b["batch_number"].value) -
        parseFloat(a["batch_number"].value)
      );
    });
  } catch {
    throw new Error("Something went wrong fetching the items.");
  }

  const latestMigrations = [];

  if (!items.length) {
    return latestMigrations;
  }

  const batchNumber = items[0]["batch_number"].value;

  for (const migration of [...items].sort()) {
    if (migration["batch_number"].value !== batchNumber) {
      return latestMigrations;
    }

    latestMigrations.push(migration["name"].value);
  }

  return latestMigrations;
};
