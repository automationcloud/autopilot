// Copyright 2020 Ubio Limited
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

/**
 * Fuzzy matches `source` string against query, returning score (higher — better)
 * and indices of matched characters.
 *
 * This replicates the functionality implemented by common IDEs and some other solutions
 * (i.e. GitHub) for searching files and symbols, with adding bias towards matching
 * the beginning of the words (called tokens), falling back to regular wildcard matching
 * which yields lower score.
 *
 * Instead of implementing a single algorithm which deals with the complexity
 * of matching, scoring and prioritizing, the algorithm is split in two:
 *
 * - `fuzzyMatchByTokens` performs matching occurring only at start of each token
 *   (i.e. start of words or word components in camelCase symbols);
 *   this algorithm doesn't try to match inside tokens (in the middle of words)
 * - `fuzzyMatchWildcard` performs a simple wildcard search
 *   (i.e. `text` -> `*t*e*x*t*`)
 *
 * Both algorithms use the same scoring system: matches that occur closer to the
 * beginning of the `source` string yield higher score. Because token-based matching
 * is generally favourable over wildcard matching, its score is multiplied by
 * numeric `tokenScoreBias` (default is 10).
 *
 * @param query Search query
 * @param source Source string (candidate) for match
 * @param options
 */
export function fuzzyMatch(query: string, source: string, options: FuzzyMatchOptions = {}): FuzzyMatchResult {
    const { tokenScoreBias = 10 } = options;
    const tokenMatch = fuzzyMatchByTokens(query, source);
    if (tokenMatch.score > 0) {
        return {
            score: tokenMatch.score * tokenScoreBias,
            matches: tokenMatch.matches,
        };
    }
    // Fall back to wildcard match
    return fuzzyMatchByWildcard(query, source);
}

/**
 * Token-based match matches each letter with the beginning of each token
 * (uppercase letter, start of word, etc), prioritizing matches that occur
 * within the token or across the tokens.
 *
 * @param query Search query
 * @param source Source string (candidate) for match
 */
export function fuzzyMatchByTokens(query: string, source: string): FuzzyMatchResult {
    // Regex is stateful and is used to advance to next token
    const regex = /[a-z][a-z0-9]*(?=[A-Z]|\b|_)|[A-Z][a-z0-9]*/g;
    // An array of indices in source string that successfully matched our query
    const matches: number[] = [];
    // An index of source string we're currently looking at
    let cursor = 0;
    // A queue of query letters to be processed
    const queue = query.toLowerCase().replace(/\s+/g, '').split('');
    while (queue.length > 0) {
        if (cursor >= source.length) {
            return { score: 0, matches: [] };
        }
        const letter = queue[0];
        if (letter === source.charAt(cursor).toLowerCase()) {
            matches.push(cursor);
            // We will now check if next character matches
            cursor += 1;
            queue.shift();
        } else {
            // No match: jump to next token, letter stays the same
            const m = regex.exec(source);
            cursor = m == null ? source.length : m.index;
        }
    }
    const score = fuzzyMatchScore(source, matches);
    return { score, matches };
}

/**
 * A fallback match algorithm that searches for occurrences of each letter
 * of `query` within `source` string, left-to-right.
 *
 * @param query Search query
 * @param source Source string (candidate) for match
 */
export function fuzzyMatchByWildcard(query: string, source: string): FuzzyMatchResult {
    const matches: number[] = [];
    let fromIdx = 0;
    query = query.toLowerCase().replace(/\s+/g, '');
    const sourceLowercased = source.toLowerCase();
    for (let i = 0; i < query.length; i++) {
        const letter = query.charAt(i).toLowerCase();
        const idx = sourceLowercased.indexOf(letter, fromIdx);
        if (idx === -1) {
            return { score: 0, matches: [] };
        }
        matches.push(idx);
        fromIdx = idx + 1;
    }
    const score = fuzzyMatchScore(source, matches);
    return { score, matches };
}

/**
 * Calculates match score given indices of matched characters within `source` string.
 * Matches that occur closer to source string beginning yield higher score.
 *
 * @param source Source string.
 * @param matches Array of indices in source string indicated matched characters.
 */
export function fuzzyMatchScore(source: string, matches: number[]): number {
    const l = source.length;
    const n = matches.length;
    const sum = matches.reduce((sum, m) => sum + m, 0);
    return n / (sum - (n / l));
}

/* eslint-disable no-console */
export function debugFuzzyMatch(query: string, source: string) {
    const match = fuzzyMatch(query, source);
    console.log(`Query: ${cyan(query)}`);
    console.log(`Candidate: ${cyan(source)}`);
    if (match.score === 0) {
        console.log(`Result: ${red('no match')}`);
    } else {
        const str = source.split('').map((l, i) => {
            return match.matches.includes(i) ? yellow(l) : l;
        }).join('');
        console.log(`Result: ${str} (score: ${match.score})`);
    }
}
/* eslint-enable no-console */

function red(str: string) {
    return '\u001b[31m' + str + '\u001b[0m';
}

function yellow(str: string) {
    return '\u001b[33m' + str + '\u001b[0m';
}

function cyan(str: string) {
    return '\u001b[32m' + str + '\u001b[0m';
}

export interface FuzzyMatchResult {
    score: number;
    matches: number[];
}

export interface FuzzyMatchOptions {
    tokenScoreBias?: number;
}
