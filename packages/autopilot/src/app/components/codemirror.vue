<template>
    <div class="codemirror"
        ref="cm">
    </div>
</template>

<script>
const { CodeMirror } = window;

export default {

    props: {
        value: {
            type: String,
            required: true,
        },
        lineNumbers: {
            type: Boolean,
            required: false,
        }
    },

    mounted() {
        const el = this.$refs.cm;
        this.emitChanges = true;
        const cm = this.cm = new CodeMirror(el, {
            value: this.value,
            mode: 'application/json',
            theme: 'ub',
            indentUnit: 2,
            tabSize: 2,
            lineNumbers: this.lineNumbers,
            styleSelectedText: true,
            extraKeys: {
                'Esc': () => {
                    this.app.viewports.focusActive(true);
                }
            }
        });
        cm.on('change', () => {
            if (this.emitChanges) {
                this.$emit('input', cm.getValue());
            }
        });
    },

    methods: {

        focusEditor() {
            this.cm.focus();
        },

    },

    watch: {
        value(newValue) {
            if (this.cm.getValue() !== newValue) {
                // A hack to avoid CodeMirror emitting the `change` after `setValue`
                // (otherwise this breaks undo/redo)
                this.emitChanges = false;
                this.cm.setValue(newValue);
                this.emitChanges = true;
            }
        }
    }

};
</script>
