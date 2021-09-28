#!/usr/bin/env node

import { Command } from "commander";
import path from "path";

const program = new Command();
const {
  name,
  version,
  description
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require("../../package.json");

const resolveExecutableFile = (command: string) => {
  return path.join(__dirname, `./migrate-${command}.js`);
};

program
  .name(name)
  .description(description)
  .version(version)
  .command("init", "Initialises the Kontent project.", {
    executableFile: resolveExecutableFile("init")
  })
  .command("make", "Creates a migration file with a specific name.", {
    executableFile: resolveExecutableFile("make")
  })
  .command("run", "Runs all the migrations that haven't been run yet.", {
    executableFile: resolveExecutableFile("run")
  })
  .command("rollback", "Rollbacks migrations one batch at a time.", {
    executableFile: resolveExecutableFile("rollback")
  });

program.parse(process.argv);
