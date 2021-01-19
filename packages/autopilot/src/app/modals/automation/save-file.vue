<template>
    <div>
        <div class="modal__buttons">
            <button class="button button--outlined-primary"
                @click="$emit('hide')">
                Cancel
            </button>
            <button class="button button--primary"
                @click="save()">
                Save file
            </button>
        </div>
    </div>
</template>

<script>
import { remote } from 'electron';
const { dialog } = remote;

export default {
    inject: [
        'saveload',
    ],
    data() {
        return {
            filepath: this.saveload.filepath || null,
        };
    },

    methods: {
        async save() {
            const { filePath } = await dialog.showSaveDialog({
                title: 'Save Automation',
                filters: [
                    { name: 'Automation', extensions: ['ubscript', 'json', 'json5'] },
                    { name: 'All Files', extensions: ['*'] },
                ],
                defaultPath: this.filepath ? this.filepath + '-copy' : 'my-awesome-automation',
            });
            if (filePath == null) {
                return;
            }
            await this.saveload.saveProjectToFile(filePath);
            this.$emit('hide');
        }
    },
};
</script>
