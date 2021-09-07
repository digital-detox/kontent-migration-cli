import path from "path";
import fs from "fs";
import dasherize from "dasherize";
import { js as beautify } from "js-beautify";
import ora from "ora";

require("dotenv").config({
  path: path.resolve(process.cwd(), "./.env")
});

type Options = {
  description?: string;
};

export default (migrationName?: string, options?: Options) => {
  if (!migrationName) {
    console.error(
      "You need to provide a migration name, e.g. $ make add-tag-field-to-page"
    );

    process.exit(1);
  }

  const migrationFolder = process.env.MIGRATION_FOLDER || "./";
  const createMigrationFile = ora(
    `Creating the migration file for ${migrationName}`
  ).start();
  const { description = "Description of the migration" } = options || {};
  const template = beautify(`
  "use strict";

  module.exports.description = "${description}";

  module.exports.up = async (client) => {
    // Your up migration code goes here.
  };
  module.exports.down = async (client) => {
    // Your down migration code goes here.
  };

  `);

  const dasherized = dasherize(migrationName);
  const timestamp = new Date().getTime();

  if (!fs.existsSync(path.resolve(process.cwd(), migrationFolder))) {
    fs.mkdirSync(path.resolve(process.cwd(), migrationFolder), {
      recursive: true
    });
  }

  fs.writeFileSync(
    path.resolve(
      process.cwd(),
      migrationFolder,
      `${timestamp}-${dasherized}.js`
    ),
    template
  );

  createMigrationFile.succeed();
};
