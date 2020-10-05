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

import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

import moment from 'moment';

const DEFAULT_INPUT_FORMAT = 'YYYY-MM-DD HH:mm:ss | YYYY-MM-DD HH:mm | YYYY-MM-DD';

export class DateFormat extends Pipe {
    static $type = 'Date.format';
    static $help = `
Parses the date from input string using specified input format,
then returns this date formatted using specified output format.

An error is thrown if input data is not a string.

See [moment.js docs](https://momentjs.com/docs/#/parsing/string-format/)
for more information about pattern strings and formatting.

### Use For

- general purpose date parsing and formatting
- filtering on dates (e.g. format Job Input date to match format on the web page)
`;

    @params.String({
        placeholder: 'YYYY-MM-DD HH:mm:ss',
        help: 'If specified, this format is used to parse the date (by default `YYYY-MM - DD HH: mm: ss` is used).',
    })
    inputFormat: string = '';

    @params.String({
        placeholder: 'YYYY-MM-DD HH:mm:ss',
        showInHeader: true,
    })
    outputFormat: string = 'YYYY-MM-DD HH:mm:ss';

    @params.Boolean({
        help: 'If checked, an error will be thrown if date does not strictly match the input format.',
    })
    strict: boolean = true;

    init(spec: any) {
        super.init(spec);
        // Migration
        if (spec.format) {
            this.outputFormat = spec.format;
        }
    }

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const inputFormat = this.inputFormat;
        const outputFormat = this.outputFormat;
        const strict = this.strict;

        const inputFormats = (inputFormat || DEFAULT_INPUT_FORMAT).split('|').map(_ => _.trim());

        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const date = this.tryParseDate(el.value, inputFormats, strict);
            return el.clone(date.format(outputFormat));
        });
    }

    tryParseDate(value: string, inputFormats: string[], strict: boolean): moment.Moment {
        for (const locale of moment.locales()) {
            for (const fmt of inputFormats) {
                const date = moment.utc(value, fmt.trim(), locale, strict);
                if (date.isValid()) {
                    return date;
                }
            }
        }
        throw util.playbackError('Value is not a valid date');
    }
}
