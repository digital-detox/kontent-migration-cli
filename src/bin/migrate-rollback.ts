#!/usr/bin/env node

import { Command } from "commander";
import rollback from "../lib/rollback";

const program = new Command();

program.name(`rollback`).parse(process.argv);

rollback();
