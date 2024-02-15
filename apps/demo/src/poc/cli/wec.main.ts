#!/usr/bin/env node
import { createWecCommand } from './createWecCommand';
import { runCommand } from './run';

runCommand(createWecCommand());
