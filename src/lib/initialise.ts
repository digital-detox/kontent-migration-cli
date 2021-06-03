import path from "path";
import { ManagementClient, ElementModels } from "@kentico/kontent-management";
import ora from "ora";

require("dotenv").config({
  path: path.resolve(process.cwd(), "./.env")
});

/**
 * 1. Connect to Kontent using .env varaibles [throw if not able to]
 * 2. Check if Migration content type exists, if it does exit without error. (process.exit(0))
 * 3. Create Migration content type
 */

const createMigrationContentType = async (client: ManagementClient) => {
  client
    .addContentType()
    .withData((builder) => {
      return {
        name: "Migration",
        codename: "migration",
        elements: [
          builder.textElement({
            name: "Name",
            codename: "name",
            type: ElementModels.ElementType.text
          }),
          builder.textElement({
            name: "Batch Number",
            codename: "batch_number",
            type: ElementModels.ElementType.text
          })
        ]
      };
    })
    .toObservable()
    .toPromise();
};

export default async () => {
  const client = new ManagementClient({
    projectId: process.env.PROJECT_ID, // id of your Kentico Kontent project
    apiKey: process.env.API_KEY // Content management API token
  });
  const initialise = ora("Initialise the Kontent project").start();

  client
    .viewContentType()
    .byTypeCodename("migration")
    .toObservable()
    .toPromise()
    .then(() => {
      initialise.info("This project seems to be already initialised.");
    })
    .catch((error) => {
      if (error.errorCode !== 108) {
        initialise.fail("Something went wrong initialising the project.");

        process.exit(0);
      }

      createMigrationContentType(client);

      initialise.succeed();
    });
};
