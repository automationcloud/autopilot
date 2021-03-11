#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
const inquirer = require('inquirer');

const { version } = require('./package.json');

const isGA = /-GA/.test(version);

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const items = [
    [`./dist/Autopilot-${version}.dmg`, `Autopilot v${version} (macOS)`],
    [`./dist/Autopilot-${version}.zip`, `Autopilot v${version} (Win x64)`],
];
const channels = ['autopilot-releases'];
if (isGA) {
    channels.push('supported-kayak');
}

send().catch(err => {
    console.error(err);
    process.exit(1);
});

async function send() {
    const releaseNotes = extractReleaseNotes(version);
    if (isGA && !releaseNotes) {
        throw new Error('Release notes are mandatory for a GA release');
    }
    console.log(`Hi there 👋`);
    console.log(`I'm about to send ${chalk.yellow(version)} release to ${chalk.yellow(channels)}\n`);
    console.log('Please review the release notes:\n');
    console.log(releaseNotes || chalk.yellow('<no release notes>'));
    console.log('\n');
    const answers = await inquirer.prompt([
        {
            type: 'expand',
            name: 'confirm',
            message: 'Are you sure you want to release all that?',
            default: 2,
            choices: [
                { key: 'y', name: 'Yes', value: true },
                { key: 'n', name: 'No', value: false },
            ],
        },
    ]);
    if (!answers.confirm) {
        return;
    }
    for (const item of items) {
        const [file, title] = item;
        console.log(`Sending ${chalk.yellow(file)} to ${chalk.yellow(channels)}...`);
        const filename = path.basename(file);
        const form = new FormData();
        form.append('token', SLACK_TOKEN);
        form.append('channels', channels.join(','));
        form.append('filename', filename);
        form.append('title', title);
        form.append('file', fs.createReadStream(file));
        await fetch(`https://ubio.slack.com/api/files.upload`, {
            method: 'post',
            headers: form.getHeaders(),
            body: form,
        });
        console.log(`${chalk.yellow(file)} sent to ${chalk.yellow(channels)}`);
    }
    if (releaseNotes) {
        console.log(`Sending release notes...`);
        for (const channel of channels) {
            const form = new FormData();
            form.append('token', SLACK_TOKEN);
            form.append('channel', channel);
            form.append('parse', 'full');
            // form.append('as_user', 'true');
            form.append('text', [`*Autopilot v${version}*`, releaseNotes].join('\n\n'));
            await fetch(`https://ubio.slack.com/api/chat.postMessage`, {
                method: 'post',
                headers: form.getHeaders(),
                body: form,
            });
        }
        console.log(`Done.`);
    }
}

function extractReleaseNotes(version) {
    const changelog = fs.readFileSync('../../CHANGELOG.md', 'utf-8');
    const heading = '## ' + version + '\n';
    const i = changelog.indexOf(heading);
    if (i === -1) {
        return '';
    }
    const lines = changelog
        .substring(i + heading.length)
        .split(isGA ? /\n\s*##(.*?-GA)\s+\n/ : /\n\s*##\s+/)[0]
        .split(/\n+/)
        .filter(_ => !/^\s*#+\s+/.test(_))
        .filter(_ => !!_.trim())
        .sort();
    return lines.join('\n');
}
