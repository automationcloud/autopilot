import { runtime } from '../../runtime';
import assert from 'assert';
import rimraf from 'rimraf';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import glob from 'glob';

const rimrafAsync = promisify(rimraf);
const globAsync = promisify(glob);

describe('RegistryService', () => {

    describe('loadExtension', () => {

        beforeEach(async () => {
            const dir = runtime.$registry.getExtensionDir('@automationcloud/extension-test', '2.5.4');
            await rimrafAsync(dir);
        });

        context('satisfying version exists', () => {

            it('loads the extension from bundle', async () => {
                const ext = await runtime.$registry.loadExtension('@automationcloud/extension-test', '^2.5.0');
                const dir = runtime.$registry.getExtensionDir('@automationcloud/extension-test', '2.5.4');
                assert((await fs.stat(dir)).isDirectory());
                assert.equal(ext.spec.name, '@automationcloud/extension-test');
                assert.equal(ext.spec.version, '2.5.4');

                const files = (await globAsync('**', { cwd: dir })).sort();
                assert.deepEqual(files, [
                    'included',
                    'included/foo.js',
                    'package.json'
                ]);
            });

            it('does not load same extension bundle twice', async () => {
                await runtime.$registry.loadExtension('@automationcloud/extension-test', '^2.5.0');
                const dir = runtime.$registry.getExtensionDir('@automationcloud/extension-test', '2.5.4');
                assert((await fs.stat(dir)).isDirectory());
                runtime.$registry.loadExtensionBundle = () => {
                    throw new Error('Unexpected second call to loadExtensionBundle');
                };
                await runtime.$registry.loadExtension('@automationcloud/extension-test', '^2.5.0');
            });

        });

        context('satisfying version does not exist', () => {

            it('throws ExtensionVersionNotFound', async () => {
                try {
                    await runtime.$registry.loadExtension('@automationcloud/extension-test', '^50.0.0');
                    throw new Error('UnexpectedSuccess');
                } catch (err) {
                    assert.equal(err.name, 'ExtensionVersionNotFound');
                }
            });

        });

    });

});
