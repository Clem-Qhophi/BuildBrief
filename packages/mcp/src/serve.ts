#!/usr/bin/env node
import { serve } from './server.js';

await serve(process.stdin, process.stdout);
