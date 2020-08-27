/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

/**
 * This is a hack for transitioning from @ubio/engine to @automationcloud/engine.
 * This allows extensions to work with both @ubio/engine and @automationcloud/engine.
 *
 * It should be removed once we fully migrate.
 */
export function createUbioSymlink(packageRoot: string) {
    const nodeModulesDir = path.resolve(packageRoot, 'node_modules');
    const symlink = path.join(nodeModulesDir, '@ubio', 'engine');
    const target = path.join(nodeModulesDir, '@automationcloud', 'engine');
    const parentDir = path.dirname(symlink);
    try {
        fs.mkdirSync(parentDir, { recursive: true });
        fs.symlinkSync(path.relative(parentDir, target), symlink, 'junction');
    } catch (err) {
        if (err.code !== 'EEXIST') {
            console.warn(err);
        }
    }
}
