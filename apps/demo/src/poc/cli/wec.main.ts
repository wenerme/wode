#!/usr/bin/env node
import { createWecCommand } from '@src/poc/cli/createWecCommand';
import { runCommand } from '@src/poc/cli/run';

runCommand(createWecCommand());
