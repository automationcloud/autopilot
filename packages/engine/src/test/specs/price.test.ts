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

import * as priceParser from '../../main/util/price';

describe('price parser', () => {
    it('should parse leading symbols with no separators', () => {
        const texts = ['GBP 1', 'GBP 12', 'GBP 123', 'GBP 1234'];
        texts.forEach(text => {
            const price = priceParser.parseFirst(text);
            assert.ok(price);
            assert.equal(price!.currencyCode, 'gbp');
            const formatted = 'GBP ' + price!.floatValue.toFixed(0);
            assert.equal(formatted, text);
        });
    });

    it('should parse trailing symbols with no separators', () => {
        const texts = ['1 GBP', '12 GBP', '123 GBP', '1234 GBP'];
        texts.forEach(text => {
            const price = priceParser.parseFirst(text);
            assert.ok(price);
            assert.equal(price!.currencyCode, 'gbp');
            const formatted = price!.floatValue.toFixed(0) + ' GBP';
            assert.equal(formatted, text);
        });
    });

    it('should ignore other text', () => {
        const price = priceParser.parseFirst('Only £ 54 each — limited offer!');
        assert.ok(price);
        assert.equal(price!.value, 5400);
        assert.equal(price!.floatValue, 54);
        assert.equal(price!.symbol, '£');
        assert.equal(price!.currencyCode, 'gbp');
    });

    it('should ignore numbers in surrounding text', () => {
        const price = priceParser.parseFirst('31 june: only £ 54 each — 1 time offer!');
        assert.equal(price!.value, 5400);
        assert.equal(price!.floatValue, 54);
        assert.equal(price!.symbol, '£');
        assert.equal(price!.currencyCode, 'gbp');
    });

    it('should not allow other text between symbol and number', () => {
        const price = priceParser.parseFirst('This £ doesn\'t 50 look like price');
        assert.ok(price == null);
    });

    it('should parse 1-digit decimal', () => {
        const texts = ['€2.7', '€2,7', '€2 7'];
        texts.forEach(text => {
            const price = priceParser.parseFirst(text);
            assert.equal(price!.currencyCode, 'eur');
            assert.equal(price!.floatValue, 2.7);
            assert.equal(price!.value, 270);
            assert.equal(price!.symbol, '€');
        });
    });

    it('should parse 2-digit decimal', () => {
        const texts = ['€2.71', '€2,71', '€2 71'];
        texts.forEach(text => {
            const price = priceParser.parseFirst(text);
            assert.equal(price!.currencyCode, 'eur');
            assert.equal(price!.floatValue, 2.71);
            assert.equal(price!.value, 271);
            assert.equal(price!.symbol, '€');
        });
    });

    it('should not parse trailing 3-digit as decimal (treat as thousands)', () => {
        const texts = ['EUR 2,718', 'EUR 2.718', 'EUR 2 718'];
        texts.forEach(text => {
            const price = priceParser.parseFirst(text);
            assert.equal(price!.currencyCode, 'eur');
            assert.equal(price!.floatValue, 2718);
            assert.equal(price!.value, 271800);
            assert.equal(price!.symbol, 'eur');
        });
    });

    it('should ignore thousands separators', () => {
        const texts = [
            '€100.500,03',
            '€100.500.03',
            '€100,500 03',
            '€100 500,03',
            '€100 500 03', // e.g. € 100 500 <sup>03</sup>
        ];
        texts.forEach(text => {
            const price = priceParser.parseFirst(text);
            assert.equal(price!.currencyCode, 'eur');
            assert.equal(price!.value, 10050003);
            assert.equal(price!.floatValue, 100500.03);
            assert.equal(price!.symbol, '€');
        });
    });

    it('should not be confused with trailing comma', () => {
        const texts = ['Was €5.99, now ...', 'Was €5 99, now ...', 'Was €5,99, now ...'];
        texts.forEach(text => {
            const price = priceParser.parseFirst(text);
            assert.equal(price!.currencyCode, 'eur');
            assert.equal(price!.value, 599);
            assert.equal(price!.floatValue, 5.99);
            assert.equal(price!.symbol, '€');
        });
    });

    it('should parse all prices from string', () => {
        const texts = [
            'Was £5.99, now £2.99',
            'Was £5.99, now 2.99£',
            '£5.99; 2.99£',
            '5.99£, £2.99',
            '£5 99; 2 99£',
            '5 99£, £2 99',
            '£5,99; 2,99£',
            '5,99£, £2,99',
        ];
        texts.forEach(text => {
            const prices = priceParser.parseAll(text);
            assert.equal(prices[0].value, 599);
            assert.equal(prices[0].floatValue, 5.99);
            assert.equal(prices[0].currencyCode, 'gbp');
            assert.equal(prices[0].symbol, '£');
            assert.equal(prices[1].value, 299);
            assert.equal(prices[1].floatValue, 2.99);
            assert.equal(prices[1].currencyCode, 'gbp');
            assert.equal(prices[1].symbol, '£');
        });
    });

    it('should parse negative prices', () => {
        const texts = [
            '- 40.99 USD',
            'USD - 40.99',
            '- USD - 40.99',
            '-50% off: your discount is - 40.99 USD',
            '-50% off: your discount is USD -40.99',
            '-50% off: your discount is - USD 40.99',
        ];
        texts.forEach(text => {
            const price = priceParser.parseFirst(text, { parseNegative: true });
            assert.ok(price);
            assert.equal(price!.value, -4099);
            assert.equal(price!.floatValue, -40.99);
            assert.equal(price!.currencyCode, 'usd');
            assert.equal(price!.symbol, 'usd');
        });
    });

    describe('regression tests', () => {
        it('should parse dhs1000', () => {
            const price = priceParser.parseFirst('dhs1000');
            assert.ok(price);
            assert.equal(price!.value, 100000);
            assert.equal(price!.currencyCode, 'mad');
        });
    });
});
