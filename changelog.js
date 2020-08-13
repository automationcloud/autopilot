#!/usr/bin/env node
// eslint-disable-next-line import/no-commonjs
const fs = require('fs');
const lernaJson = require('./lerna.json');

const changelogText = fs.readFileSync('CHANGELOG.md', 'utf-8');
const unversionedLines = changelogText.split(/^## /m)[0].trim();

if (unversionedLines) {
    const newChangelog = ['## ', lernaJson.version, '\n\n', changelogText].join('');
    fs.writeFileSync('./CHANGELOG.md', newChangelog, 'utf-8');
}
