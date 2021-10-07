import { ContentItem } from "@kentico/kontent-delivery";
import { ManagementClient, ElementModels } from "@kentico/kontent-management";
import path from "path";
import fs, { Dirent } from "fs";
import { promisify } from "util";
import ora from "ora";
import { getRemoteMigrations, sanatiseCodename } from "./util";

require("dotenv").config({
  path: path.resolve(process.cwd(), "./.env")
});

const readdir = promisify(fs.readdir);

const getProjectMigrations = async () => {
  try {
    const projectMigrations = await readdir(
      path.resolve(process.cwd(), process.env.MIGRATION_FOLDER || "./"),
      {
        withFileTypes: true
      }
    );
    return projectMigrations
      .filter((file) => file.isFile())
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
};

const getTodoMigrations = (
  projectMigrations: Dirent[],
  remoteMigrations: ContentItem[]
): Dirent[] => {
  if (remoteMigrations.length === 0) {
    return projectMigrations;
  }
  const migrationNames = remoteMigrations.map(
    (migration) => migration.name.value
  );
  return projectMigrations.filter(
    (file) => !migrationNames.includes(file.name)
  );
};

const saveMigrationEntry = async (
  client: ManagementClient,
  {
    name,
    description,
    batch
  }: { name: string; description: string; batch: number }
) => {
  const contentItem = await client
    .addContentItem()
    .withData({
      name: description,
      codename: sanatiseCodename(name),
      type: {
        codename: "migration"
      }
    })
    .toObservable()
    .toPromise();

  const itemId = contentItem?.data?.id;

  if (!itemId) {
    throw new Error("Unable to save the migration entry.");
  }

  await client
    .upsertLanguageVariant()
    .byItemId(itemId)
    // @todo find out default language from Project API
    .byLanguageCodename("default")
    .withData((builder) => [
      builder.textElement({
        element: {
          codename: "name"
        },
        value: name
      }),
      builder.textElement({
        element: {
          codename: "batch_number"
        },
        value: batch.toString()
      })
    ])
    .toObservable()
    .toPromise();
};

export default async () => {
  const run = ora("Calculating migrations to run").start();
  const remoteMigrations = await getRemoteMigrations();
  const projectMigrations = await getProjectMigrations();
  const todoMigrations = getTodoMigrations(projectMigrations, remoteMigrations);
  const client = new ManagementClient({
    projectId: process.env.PROJECT_ID,
    apiKey: process.env.API_KEY
  });

  if (!todoMigrations.length) {
    run.info("All migrations have been run already!");
    process.exit(0);
  }

  run.succeed();

  for (const todoMigration of todoMigrations) {
    const { up, description } = await require(path.resolve(
      process.cwd(),
      process.env.MIGRATION_FOLDER || "./",
      todoMigration.name
    ));
    const migrationTask = ora(`Running migration ${description}`).start();

    try {
      await up(client, { ElementModels });

      migrationTask.text = `Saving the migration ${description}`;

      await saveMigrationEntry(client, {
        name: todoMigration.name,
        description,
        batch: remoteMigrations.length
          ? parseFloat([...remoteMigrations].pop()["batch_number"].value) + 1
          : 1
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
        `The migration ${description} failed because ... ${error.message}${validationErrorsStr}`
      );
      process.exit(0);
    }
  }
};
