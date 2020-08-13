<template>
    <div class="param--template param--inset">

        <label class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls">
                <input class="input input--stretch"
                    :placeholder="param.placeholder"
                    v-model="value"
                    ref="input"/>
                <div class="options">
                    <button v-if="paths.length"
                        class="button button--default button--small"
                        v-for="path of paths"
                        @click="insertPath(path)">
                        {{ path }}
                    </button>
                </div>
            </div>
        </label>

    </div>
</template>

<script>
import ParamMixin from './param-mixin';
import { helpers } from '../../../util';

export default {

    mixins: [ParamMixin],

    computed: {

        paths() {
            const el = this.el || {};
            const value = el.value || {};
            if (typeof value !== 'object') {
                return [];
            }
            return helpers.collectPointers(value)
                .filter(ptr => ['string', 'number'].includes(typeof ptr.value))
                .map(ptr => ptr.path);
        }

    },

    methods: {

        insertPath(path) {
            const input = this.$refs.input;
            input.focus();
            const { selectionStart, selectionEnd } = input;
            this.value = input.value.substring(0, selectionStart) +
                '{' + path + '}' + input.value.substring(selectionEnd);
            const newSelectionStart = selectionStart + path.length + 2;
            input.setSelectionRange(newSelectionStart, newSelectionStart);
        }

    }

};
</script>

<style scoped>
.options {
    margin: 0 calc(-1 * var(--gap--small));
}

.options button {
    margin: var(--gap--small);
}
</style>
