<template>
    <div>
        <div class="modal__buttons">
            <button class="button button--outlined-primary"
                @click="$emit('hide')">
                Cancel
            </button>
            <button class="button button--primary"
                @click="open()">
                Select file
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

    methods: {
        async open() {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Open Automation',
                filters: [
                    { name: 'Automation', extensions: ['ubscript', 'json', 'json5'] },
                    { name: 'All Files', extensions: ['*'] },
                ],
            });
            const filepath = filePaths[0] || '';
            if (filepath == null) {
                return;
            }
            await this.saveload.openProjectFromFile(filepath);
            this.$emit('hide');
        }
    },
};
</script>
