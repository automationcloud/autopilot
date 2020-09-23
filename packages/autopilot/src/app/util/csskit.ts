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

const SPECIAL_CHARS = '!"#$%&\'()*+,./:;<=>?@[]^`{|}~';
const WHITESPACE_CHARS = ' \t\n';
const QUOTE_CHARS = '\'"';
const COMBINATOR_CHARS = '>+~';

const JUNK_WORDS = [
    'visible',
    'hidden',
    'active',
    'required',
    'clearfix',
    'padding',
    'nopadding',
    'margin',
    'nomargin',
    'border',
    'noborder',
    'rtl',
    'ltr',
    'float',
    'align',
    'col-xs',
    'col-sm',
    'col-md',
    'col-lg',
    'flexbox',
    'localstorage',
    'hashchange',
];

const JUNK_REGEX = new RegExp(`(?:^|[-_])(?:${JUNK_WORDS.join('|')})(?:[-_]|$)`, 'i');

export interface SelectorChunk {
    tagName: string;
    id: string;
    classList: string[];
    attributes: Array<{
        key: string;
        op: string;
        val: string;
    }>;
}

export function isJunkIdentifier(ident: string): boolean {
    return [
        // Noise from popular frameworks
        ['ng-', 'ko-'].some(prefix => ident.indexOf(prefix) === 0),
        // Popular modifiers
        JUNK_REGEX.test(ident),
        // Contains multiple digits
        /\d{3,}/.test(ident),
    ].some(Boolean);
}

export function parseSelector(str: string) {
    const parser = new SelectorParser(str.trim());
    return parser.parse();
}

export function isChunkEmpty(chunk: SelectorChunk) {
    return [!chunk.tagName, !chunk.id, !chunk.classList.length, !chunk.attributes.length].every(Boolean);
}

export function createEmptyChunk(): SelectorChunk {
    return {
        tagName: '',
        id: '',
        classList: [],
        attributes: [],
    };
}

export function createSelector(chunks: SelectorChunk[]) {
    return chunks
        .filter(chunk => !isChunkEmpty(chunk))
        .map(chunk => {
            let buf = '';
            if (chunk.tagName) {
                buf += chunk.tagName;
            }
            if (chunk.id) {
                buf += '#' + CSS.escape(chunk.id);
            }
            for (const cl of chunk.classList) {
                buf += '.' + CSS.escape(cl);
            }
            for (const attr of chunk.attributes) {
                const valClause = attr.val ? `${attr.op}"${CSS.escape(attr.val)}"` : '';
                buf += `[${CSS.escape(attr.key)}${valClause}]`;
            }
            return buf;
        })
        .filter(Boolean)
        .join(' ');
}

/**
 * Intentionally forgiving selector parser, drops unsupported features,
 * with best effor to recover from incorrect syntax.
 */
export class SelectorParser {
    str: string;
    pos: number = 0;

    constructor(str: string) {
        this.str = str;
    }

    parse(): SelectorChunk[] {
        const chunks = [];
        while (this.hasMore()) {
            chunks.push(this.consumeChunk());
            // Combinators are dropped silently
            this.consumeWhile(c => this.isCombinator(c) || this.isWhitespace(c));
        }
        return chunks;
    }

    consumeChunk(): SelectorChunk {
        const chunk = createEmptyChunk();
        chunk.tagName = this.consumeTagName();
        while (this.hasMore() && !this.isWhitespace(this.str[this.pos])) {
            this.consumeSimpleSelector(chunk);
        }
        return chunk;
    }

    consumeTagName(): string {
        if (this.str[this.pos] === '*') {
            this.consumeNormalChar();
            return '';
        }
        return this.consumeUntilDelim();
    }

    consumeSimpleSelector(chunk: SelectorChunk) {
        const char = this.consumeEscapableChar();
        switch (char) {
            case '.':
                chunk.classList.push(this.consumeUntilDelim());
                break;
            case '#':
                chunk.id = this.consumeUntilDelim();
                break;
            case '[':
                chunk.attributes.push({
                    key: this.consumeUntilDelim(),
                    op: this.consumeOperator(),
                    val: this.consumeQuotedString(),
                });
                this.consumeExact(']');
                break;
            // Everything else is dropped silently
            case '(':
                this.consumeUntilChar(')');
                this.consumeNormalChar();
                return null;
            case '"':
                this.consumeUntilChar('"');
                this.consumeNormalChar();
                return null;
            case '\'':
                this.consumeUntilChar('\'');
                this.consumeNormalChar();
                return null;
            default:
                this.consumeUntilWhitespace();
                return null;
        }
    }

    consumeQuotedString(): string {
        const quote = this.consumeEscapableChar();
        if (!this.isQuote(quote)) {
            return '';
        }
        const content = this.consumeUntilChar(quote);
        this.consumeEscapableChar();
        return content;
    }

    consumeOperator(): string {
        return this.consumeWhile(c => this.isSpecialChar(c) && !this.isQuote(c));
    }

    consumeUntilWhitespace(): string {
        return this.consumeWhile(c => !this.isWhitespace(c));
    }

    consumeUntilDelim(): string {
        return this.consumeWhile(c => !this.isDelim(c));
    }

    consumeUntilChar(char: string): string {
        return this.consumeWhile(c => c !== char);
    }

    consumeWhile(predicate: (char: string) => boolean): string {
        const buf = [];
        while (this.hasMore() && predicate(this.str[this.pos])) {
            buf.push(this.consumeEscapableChar());
        }
        return buf.join('');
    }

    consumeEscapableChar(): string {
        const char = this.str[this.pos];
        this.pos += 1;
        if (char === '\\') {
            // Escape sequence
            const m = /^(\d{1,6})\s?/.exec(this.str.substring(this.pos));
            if (m) {
                this.pos += m[0].length;
                return String.fromCharCode(parseInt(m[1], 16));
            }
            const nextChar = this.str[this.pos];
            this.pos += 1;
            return nextChar;
        }
        return char;
    }

    consumeNormalChar(): string {
        const char = this.str[this.pos];
        this.pos += 1;
        return char;
    }

    consumeExact(char: string): string {
        return this.str[this.pos] === char ? this.consumeNormalChar() : '';
    }

    hasMore(): boolean {
        return this.pos < this.str.length;
    }

    isSpecialChar(char: string): boolean {
        return SPECIAL_CHARS.includes(char);
    }

    isWhitespace(char: string): boolean {
        return WHITESPACE_CHARS.includes(char);
    }

    isQuote(char: string): boolean {
        return QUOTE_CHARS.includes(char);
    }

    isDelim(char: string): boolean {
        return this.isSpecialChar(char) || this.isWhitespace(char);
    }

    isCombinator(char: string): boolean {
        return COMBINATOR_CHARS.includes(char);
    }
}
