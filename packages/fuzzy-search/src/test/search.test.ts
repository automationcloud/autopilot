// Copyright 2020 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import assert from 'assert';

import { fuzzySearch } from '../main';

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
