import { ContentItem } from "@kentico/kontent-delivery";
import { ManagementClient, ElementModels } from "@kentico/kontent-management";
import path from "path";
import fs, { Dirent } from "fs";
import { promisify } from "util";
import ora from "ora";
import { getLatestMigration, sanatiseCodename } from "./util";

require("dotenv").config({
  path: path.resolve(process.cwd(), "./.env")
});

const readdir = promisify(fs.readdir);

const getProjectMigrations = async () => {
  const projectMigrations = await readdir(
    path.resolve(process.cwd(), process.env.MIGRATION_FOLDER || "./"),
    { withFileTypes: true }
  ).catch((e) => console.error(e));

  return (projectMigrations || [])
    .filter((f) => f.isFile())
    .sort((a, b) => a.name.localeCompare(b.name));
};

const getTodoMigrations = (
  projectMigrations: Dirent[],
  latestMigration?: ContentItem
): Dirent[] => {
  if (!latestMigration) {
    return projectMigrations;
  }

  const latestMigrationPosition = projectMigrations.findIndex(
    (f) => f.name === latestMigration["name"].value
  );

  return projectMigrations.slice(latestMigrationPosition + 1);
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
    .toPromise()
    .catch((e) => console.error(e));

  const itemId = (contentItem || {}).data?.id;

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
    .toPromise()
    .catch((e) => console.error(e));
};

export default async () => {
  const run = ora("Calculating migrations to run").start();
  const latestMigration = await getLatestMigration();
  const projectMigrations = await getProjectMigrations();
  const todoMigrations = getTodoMigrations(projectMigrations, latestMigration);
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
      await up(client, { ElementModels })
        .then((i) => {
          migrationTask.text = `content type created:: ${i}`;
        })
        .catch((e) => console.error(e));

      migrationTask.text = `Saving the migration ${description}`;

      await saveMigrationEntry(client, {
        name: todoMigration.name,
        description,
        batch: latestMigration
          ? parseFloat(latestMigration["batch_number"].value) + 1
          : 1
      }).catch((e) => console.error(e));

      migrationTask.succeed();
    } catch (error) {
      console.log(error);
      migrationTask.fail(
        `The migration ${description} failed because ... ${error.message}`
      );
      process.exit(0);
    }
  }
};
