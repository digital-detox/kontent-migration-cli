#!/usr/bin/env node

import { Command } from "commander";
import initialise from "../lib/initialise";

const program = new Command();

program.name(`init`).parse(process.argv);

initialise();
