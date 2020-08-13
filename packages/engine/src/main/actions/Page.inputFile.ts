import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { BlobService } from '../services';
import { params } from '../model';

export class InputFileAction extends Action {
    static $type = 'Page.inputFile';;
    static $icon = 'far fa-file';
    static $help = `
Sets file (blob data) to \`<input type = "file" />\`.

The pipeline should produce a single element with \`<input type = "file" />\` and Blob object value.
The action assigns the blob to this input, allowing for uploading files using \`multipart/form-data\` forms.

The pipeline should return a Blob object which consists of:

- \`blobId\` (string) a unique blob identifier
- \`filename\` (string)

The Blob object should first be downloaded using [Fetch Blob](#fetch-blob).

### Use For

- uploading files via HTML forms (\`<input type = "file"/>\`)
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    get $blobs() {
        return this.$engine.get(BlobService);
    }

    async exec() {
        await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            const { tagName, attributes } = await el.getInfo();
            util.assertPlayback(tagName === 'input', `Expected <input> element, instead got <${tagName}>`);
            util.assertPlayback(
                attributes.type === 'file',
                `Expected <input type="file"> instead got type="${attributes.type}"`,
            );
            util.checkType(el.value, 'object');
            util.checkType(el.value.blobId, 'string', 'blobId');
            const filename = String(el.value.filename) || '';
            let blob = this.$blobs.getBlob(el.value.blobId);
            // If filename is provided, copy the blob
            if (filename && blob.filename !== filename) {
                util.assertPlayback(
                    /^[a-zA-Z0-9._-]+$/.test(filename),
                    'Filename must contain alphanumeric characters and extension',
                );
                blob = await this.$blobs.copy(blob, filename);
            }
            await this.$page.send('DOM.setFileInputFiles', {
                files: [blob.file],
                objectId: el.objectId,
            });
        });
    }
}
