<template>
    <div class="param--keys param--inset">

        <label class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls">
                <div class="form-line"
                    v-if="value.length">
                    <div class="tag tag--cool"
                        v-for="key of value">
                        <span class="tag__label">
                            {{ key }}
                        </span>
                        <a class="tag__remover"
                            @click="removeKey(key)">
                            <i class="fa fa-times">
                            </i>
                        </a>
                    </div>
                </div>
                <div class="group group--gap--small stretch">
                    <autocomplete
                        class="stretch"
                        input-class="stretch input--small"
                        v-model="newKey"
                        :options="availableKeys"
                        placeholder="Add key"
                        @enterkey="addKey"/>
                    <button class="button button--primary button--icon button--small"
                        :disabled="!newKey"
                        @click="addKey">
                        <i class="fa fa-plus">
                        </i>
                    </button>
                </div>
            </div>
        </label>

    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin],

    data() {
        return {
            newKey: ''
        };
    },

    computed: {

        availableKeys() {
            const el = this.el || {};
            const value = el.value || {};
            return Object.keys(value);
        }

    },

    methods: {


        addKey() {
            const newKeys = new Set(this.value);
            newKeys.add(this.newKey.trim());
            this.value = [...newKeys];
        },

        removeKey(key) {
            const newKeys = new Set(this.value);
            newKeys.delete(key.trim());
            this.value = [...newKeys];
        }

    }

};
</script>
