import { fuzzySearch } from '../main';
import assert from 'assert';

const candidates = [
    'DOM.getText',
    'DOM.getInnerText',
    'DOM.getTextContent',
    'DOM.queryAll',
    'DOM.queryOne',
    'DOM.batchExtract',
    'Value.containsText',
    'Value.equalsText',
    'String.extractRegexp',
];

describe('Fuzzy match', () => {

    it('query: text', () => {
        const results = fuzzySearch('text', candidates);
        assert.deepEqual(results.map(r => r.source), [
            'DOM.getText',
            'DOM.getTextContent',
            'DOM.getInnerText',
            'Value.equalsText',
            'Value.containsText',
            'String.extractRegexp',
            'DOM.batchExtract',
        ]);
        assert.deepEqual(results.map(r => highlight(r.source, r.matches)), [
            'dom.getTEXT',
            'dom.getTEXTcontent',
            'dom.getinnerTEXT',
            'value.equalsTEXT',
            'value.containsTEXT',
            'sTring.EXTractregexp',
            'dom.baTchEXTract',
        ]);
    });

    it('query: as', () => {
        const results = fuzzySearch('qall', candidates);
        assert.deepEqual(results.map(r => r.source), [
            'DOM.queryAll',
        ]);
        assert.deepEqual(results.map(r => highlight(r.source, r.matches)), [
            'dom.QueryALL',
        ]);
    });

    it('query: aas', () => {
        const results = fuzzySearch('aas', candidates);
        assert.deepEqual(results.map(r => r.source), [
            'Value.equalsText',
            'Value.containsText',
        ]);
        assert.deepEqual(results.map(r => highlight(r.source, r.matches)), [
            'vAlue.equAlStext',
            'vAlue.contAinStext',
        ]);
    });

});

/**
 * Highlights source for testing
 *
 * @param source
 * @param matches
 */
function highlight(source: string, matches: number[]) {
    return source.split('')
        .map((l, i) => matches.includes(i) ? l.toUpperCase() : l.toLowerCase())
        .join('');
}
