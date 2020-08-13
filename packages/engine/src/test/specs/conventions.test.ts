import path from 'path';
import glob from 'glob';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import assert from 'assert';

const globAsync = promisify(glob);

describe('Conventions', () => {

    context('actions', () => {
        it('filename matches type', async () => {
            const dir = path.join(process.cwd(), 'src/main/actions');
            const files = await globAsync('**/*.ts', { cwd: dir });
            const mismatches: string[] = [];
            for (const relPath of files) {
                const file = path.join(dir, relPath);
                const code = await fs.readFile(file, 'utf-8');
                const type = extractType(code);
                if (!type) {
                    continue;
                }
                if (`${type}.ts` !== relPath) {
                    mismatches.push(relPath);
                }
            }
            assert.equal(mismatches.length, 0,
                'Mismatching action filenames:\n' + mismatches.join('\n'))
        });
    });

    context('pipes', () => {
        it('filename matches type', async () => {
            const dir = path.join(process.cwd(), 'src/main/pipes');
            const files = await globAsync('**/*.ts', { cwd: dir });
            const mismatches: string[] = [];
            for (const relPath of files) {
                const file = path.join(dir, relPath);
                const code = await fs.readFile(file, 'utf-8');
                const type = extractType(code);
                if (!type) {
                    continue;
                }
                if (`${type}.ts` !== relPath) {
                    mismatches.push(relPath);
                }
            }
            assert.equal(mismatches.length, 0,
                'Mismatching pipe filenames:\n' + mismatches.join('\n'))
        });
    });

});

function extractType(code: string) {
    const m = /static\s+\$type\s+=\s+'(.*?)';/.exec(code);
    return m ? m[1] : null;
}
