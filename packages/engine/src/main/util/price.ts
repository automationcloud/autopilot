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

import { currencies, Currency } from './currencies';

export interface PriceParseResult {
    value: number;
    currencyCode: string;
    floatValue: number;
    symbol: string;
    currency: Currency;
}

export interface PriceParseOptions {
    parseNegative?: boolean;
}

// Construct regular expressions

const allSymbols = currencies
    .reduce((syms: string[], curr: Currency) => syms.concat(curr.code).concat(curr.symbols), [])
    .map(sym => sym.replace(/([$.])/g, '\\$1'))
    .join('|');
const minuses = '[−–‑—‒-]';
const delimiters = `[\\s.,\\'‘’‛′´\`]`;
const numGroup = `(\\s*\\d+(?:${delimiters}*\\d+)*)`;
const symGroup = `(${allSymbols})`;

const leadingSym = [minuses + '?', symGroup, minuses + '?', numGroup].join('\\s*');
const trailingSym = [minuses + '?', numGroup, symGroup].join('\\s*');

const startDelimiter = '(?:^|\\s+)';
const endDelimiter = `(?=$|\\s+|[,;:\\!\\?\\.\\'"\\+\\-])`;
const mainGroups = `(?:\\s*${[leadingSym, trailingSym].join('|')})`;

const priceRegex = new RegExp(`${startDelimiter}${mainGroups}${endDelimiter}`, 'ig');

export function parseAll(text: string, options: PriceParseOptions = {}): PriceParseResult[] {
    text = normalize(text);
    if (!text) {
        return [];
    }
    priceRegex.lastIndex = 0;
    const results: PriceParseResult[] = [];
    performNextMatch();
    return results;

    function performNextMatch() {
        const m = priceRegex.exec(text);
        if (m) {
            const result = matchResultToPrice(m, options);
            if (result) {
                results.push(result);
            }
            performNextMatch();
        }
    }
}

export function parseFirst(text: string, options: PriceParseOptions = {}): PriceParseResult | null {
    text = normalize(text);
    if (!text) {
        return null;
    }
    priceRegex.lastIndex = 0;
    const m = priceRegex.exec(text);
    return m ? matchResultToPrice(m, options) : null;
}

function matchResultToPrice(match: RegExpExecArray, options: PriceParseOptions = {}): PriceParseResult | null {
    const { parseNegative = false } = options;
    const isNegative = new RegExp(minuses).test(match[0]);
    const symbol = (match[1] || match[4] || '').toLowerCase();
    const currency = currencies.find(cur => cur.code === symbol || cur.symbols.indexOf(symbol) > -1);
    if (!currency) {
        // Assertion note: this should not happen if regex are assembled correctly
        // tests should cover that
        return null;
    }
    const exponent = currency.exponent;
    const sign = parseNegative && isNegative ? -1 : 1;
    const floatValue = sign * parseNumber(match[2] || match[3], exponent);
    const value = Math.round(floatValue * Math.pow(10, exponent));
    return {
        value,
        currencyCode: currency.code,
        floatValue,
        symbol,
        currency,
    };
}

function parseNumber(str: string, exponent: number): number {
    const chunks = str.split(new RegExp(delimiters + '+'));
    const num = parseInt(chunks.join(''), 10);
    const lastChunk = chunks.slice(-1)[0];
    const hasDecimalPoint = chunks.length > 1 && lastChunk.length <= exponent;
    const actualExponent = lastChunk.length;
    return hasDecimalPoint ? num / Math.pow(10, actualExponent) : num;
}

export function normalize(str: string) {
    str = String(str || '');
    str = str.replace(/[\u200e-\u200f]/g, '');
    return str;
}
