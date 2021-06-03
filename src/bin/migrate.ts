#!/usr/bin/env node

// import { program } from "commander";
import { Command } from "commander";
const program = new Command();
const {
  name,
  version,
  description
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require("../../package.json");

program
  .name(name)
  .description(description)
  .version(version)
  .command("init", "Initialises the Kontent project.")
  .command("make", "Creates a migration file with a specific name.")
  .command("run", "Runs all the migrations that haven't been run yet.")
  .command("rollback", "Rollbacks migrations one batch at a time.");

program.parse(process.argv);
