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

import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import { params } from '../model';
import { Pipe } from '../pipe';
import { BlobEncoding, BlobService } from '../services';
import * as util from '../util';

export class DataGetBlob extends Pipe {
    static $type = 'Data.getBlob';
    static $help = `
Returns blob content in a specified encoding.

Input value must be a Blob object, returned by Send Network Request action with "blob" response type.

Caution: decoding large blobs may result in decreased application and engine performance.

### Use For

- sending base64 encoded blobs as part of Send Network Request action
`;

    @params.Enum({
        enum: Object.values(BlobEncoding),
    })
    encoding: BlobEncoding = BlobEncoding.BINARY;

    get $blobs() {
        return this.$engine.get(BlobService);
    }

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const encoding = this.encoding;
        return this.map(inputSet, async el => {
            util.checkType(el.value, 'object');
            util.checkType(el.value.blobId, 'string', 'blobId');
            const buffer = await this.$blobs.readBlob(el.value.blobId);
            return el.clone(buffer.toString(encoding as BufferEncoding));
        });
    }
}
