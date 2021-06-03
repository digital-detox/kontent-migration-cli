#!/usr/bin/env node

import { Command } from "commander";
import make from "../lib/create-migration-file";

const program = new Command();

program.name(`make <migration-name>`).parse(process.argv);

make(program.args[0]);
