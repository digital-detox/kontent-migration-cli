#!/usr/bin/env node

import { Command } from "commander";
import make from "../lib/create-migration-file";

const program = new Command();

program
  .name(`make <migration-name>`)
  .option(
    "-d, --description [message]",
    "Optional description for the migration. You'll be able to add it later in the file anyway."
  )
  .parse(process.argv);

make(program.args[0], program.opts());
