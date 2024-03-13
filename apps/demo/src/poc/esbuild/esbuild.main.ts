#!/usr/bin/env node
import process from 'node:process';
import { createEsbuildCommand } from '@/poc/esbuild/createEsbuildCommand';

let root = createEsbuildCommand();
root.parse(process.argv);
