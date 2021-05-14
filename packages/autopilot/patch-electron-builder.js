// https://github.com/electron-userland/electron-builder/issues/5064
const path = require('path');
const fs = require('fs');

const file = path.join(process.cwd(), '../../node_modules/app-builder-lib/out/fileMatcher.js');

const text = fs.readFileSync(file, 'utf-8');
const badLine = /(const excludedExts = ".*),d.ts(";)/;
const newText = text.replace(badLine, '$1$2');

fs.writeFileSync(file, newText, 'utf-8');
