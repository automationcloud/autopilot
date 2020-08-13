import { runtime } from '../runtime';
import assert from 'assert';
import { actionRenameMap, pipeRenameMap } from '../../main/migrations';

describe('Migrations', () => {

    context('the big renaming', () => {

        it.skip('covers all existing pipes/actions', () => {
            const missing = getMissingRenames();
            assert.equal(missing.length, 0, `Missing renames:\n` + missing.join('\n'));
        });

    });

});

function getMissingRenames() {
    const resolver = runtime.$resolver;
    const actionIndex = resolver.getActionIndex();
    const pipeIndex = resolver.getPipeIndex();
    const missing: string[] = [];
    for (const [from, to] of Object.entries(actionRenameMap)) {
        if (actionIndex.get(to) == null) {
            missing.push('action:' + from);
        }
    }
    for (const [from, to] of Object.entries(pipeRenameMap)) {
        if (pipeIndex.get(to) == null) {
            missing.push('pipe:' + from);
        }
    }
    return missing;
}
