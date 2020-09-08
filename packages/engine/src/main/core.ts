import { Extension } from './extension';
import fs from 'fs';
import path from 'path';

const pkgFile = path.join(__dirname, '../../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));

/**
 * Core extension providing actions and pipes packed into the engine codebase.
 */
export const coreExtension = new Extension(__dirname, {
    name: '<core>',
    title: '',
    description: 'UBIO Automation Core',
    version: pkg.version,
    modules: [
        './matcher.js',
        './definition.js',
        './actions/**/*.js',
        './pipes/**/*.js',
        './inspections/**/*.js',
    ],
});
