import { DeliveryClient, ContentItem } from "@kentico/kontent-delivery";
import path from "path";

require("dotenv").config({
  path: path.resolve(process.cwd(), "./.env")
});

const deliveryClient = new DeliveryClient({
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

export const getMigrationsByBatchNumber = async (batchNumber: number) => {
  const { items } = await deliveryClient
    .items()
    .type("migration")
    .elementsParameter([
      // TODO:
      "batch_number"
    ])
    .toObservable()
    .toPromise();

  return items;
};
