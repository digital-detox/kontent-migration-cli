import { ManagementClient, ElementModels } from "@kentico/kontent-management";
import path from "path";
import ora from "ora";
import { getLatestBatchMigrations, sanatiseCodename } from "./util";

require("dotenv").config({
  path: path.resolve(process.cwd(), "./.env")
});

const deleteMigrationEntry = (
  client: ManagementClient,
  { name }: { name: string }
) => {
  return client
    .deleteContentItem()
    .byItemCodename(sanatiseCodename(name))
    .toObservable()
    .toPromise();
};

export default async () => {
  const run = ora("Calculating migrations to rollback").start();
  let latestMigrations: string[];

  try {
    latestMigrations = await getLatestBatchMigrations();
  } catch (error) {
    run.fail(error.message);
    process.exit(1);
  }

  if (!latestMigrations.length) {
    run.info("There are no migrations to rollback.");

    process.exit(0);
  }

  run.succeed(
    `Found ${latestMigrations.length} migration(s) to be rolled back.`
  );

  const todoMigrations = latestMigrations.map((filename) =>
    path.resolve(process.cwd(), process.env.MIGRATION_FOLDER || "./", filename)
  );

  const client = new ManagementClient({
    projectId: process.env.PROJECT_ID,
    apiKey: process.env.API_KEY
  });

  run.succeed();

  for (const todoMigration of todoMigrations) {
    const { down, description } = await require(path.resolve(
      process.cwd(),
      process.env.MIGRATION_FOLDER || "./",
      todoMigration
    ));
    const migrationTask = ora(
      `Rolling back migration "${description}"`
    ).start();

    try {
      await down(client, { ElementModels });

      migrationTask.text = `Deleting the migration "${description}"`;

      await deleteMigrationEntry(client, {
        name: todoMigration
      });

      migrationTask.succeed();
    } catch (error) {
      const validationErrorsStr = error.validationErrors.reduce(
        (prevErr, err) => {
          return `${prevErr}${err.message}\n`;
        },
        "\nValidation Errors:\n"
      );
      migrationTask.fail(
        `The migration ${description} failed for the following reason: ${error.message}${validationErrorsStr}`
      );
      process.exit(1);
    }
  }

  ora("All migrations were rolled back succesfully!").succeed();
};
