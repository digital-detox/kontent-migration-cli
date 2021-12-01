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

export const getRemoteMigrations = async (): Promise<ContentItem[]> => {
  const { items } = await deliveryClient
    .items()
    .type("migration")
    .orderByDescending("elements.name")
    .toObservable()
    .toPromise();

  return items;
};

export const sanitiseCodename = (codename: string): string => {
  return path.basename(codename, ".js").replace(/\d*-/g, "").replace(/-/g, "_");
};

export const getLastBatchNumber = (migrations: ContentItem[]): number => {
  return parseFloat(
    migrations
      .map(({ batch_number: { value } }) => value)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .pop() || "0"
  );
};

export const getLatestBatchMigrations = async (): Promise<string[]> => {
  try {
    const { items } = await deliveryClient
      .items()
      .type("migration")
      .toObservable()
      .toPromise();
    const latestBatchNumber = getLastBatchNumber(items);

    return items
      .filter(
        ({ batch_number: { value } }) => parseFloat(value) === latestBatchNumber
      )
      .map(({ name: { value } }) => value);
  } catch {
    throw new Error("Something went wrong fetching the items.");
  }
};
