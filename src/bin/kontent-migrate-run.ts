#!/usr/bin/env node

import { Command } from "commander";
import run from "../lib/run";

const program = new Command();

program.name(`run`).parse(process.argv);

run();
