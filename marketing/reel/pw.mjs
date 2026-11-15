// Reuse TwinStudio's playwright-core with the system Edge (no browser download needed).
import { createRequire } from 'node:module';
const require = createRequire('C:/hari/code/twin-souls-studio/package.json');
export const { chromium } = require('playwright-core');
export const launch = () => chromium.launch({ channel: 'msedge', headless: true });
