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

import { Action } from '../action';
import { Pipeline } from '../pipeline';
import { params } from '../model';
import { BlobEncoding, BlobService } from '../services';
import { JsonSchema } from '../schema';

export class DataSetBlob extends Action {
    static $type = 'Data.setBlob';
    static $icon = 'fas fa-database';
    static $help = `
Computes a pipeline, storing a result as a blob with specified encoding.

The pipeline should evaluate to object with following structure:

- \`filename\` (string) — filename of blob
- \`content\` (string) — string content in encoding as specified by \`encoding\` parameter

The blob can subsequently be obtained using \`Data.getBlob\` pipe.
`;
    static $schema: JsonSchema = {
        type: 'object',
        required: ['filename', 'content'],
        properties: {
            filename: { type: 'string' },
            content: { type: 'string' },
        },
    };

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.Outcome({
        label: 'Result',
        placeholder: 'Run the action to see the outcome value.',
    })
    $outcome: any = undefined;

    @params.Enum({
        enum: Object.values(BlobEncoding),
    })
    encoding: BlobEncoding = BlobEncoding.BINARY;

    get $blobs() {
        return this.$engine.get(BlobService);
    }

    reset() {
        super.reset();
        this.$outcome = undefined;
    }

    async exec() {
        await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            const { filename, content } = this.validate(el.value);
            const buffer = Buffer.from(content, this.encoding as any);
            this.$outcome = await this.$blobs.createBlob(filename, buffer);
        });
    }
}
