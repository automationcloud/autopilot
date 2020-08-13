<template>
    <div class="setting-entry flexrow">

        <div class="setting-entry__key">
            {{ entry.decl.key}}
        </div>

        <div class="setting-entry__values">

            <template v-if="editing">

                <div class="settings-entry__edit-row"
                    v-for="(v, env) of editValues">
                    <span class="settings-entry__edit-env badge badge--small"
                        :class="'badge--' + env">{{ env }}</span>

                    <template v-if="v == null">
                        <a @click="editValues[env] = defaultValue"
                            class="settings-entry__edit-link">
                            <i class="fas fa-plus"></i>
                        </a>
                    </template>
                    <template v-else>
                        <input class="input--small stretch"
                            v-model="editValues[env]"
                            v-if="entry.decl.type === 'string'"/>
                        <input class="input--small stretch"
                            type="number"
                            v-model="editValues[env]"
                            v-if="entry.decl.type === 'number'"/>
                        <input type="checkbox"
                            v-model="editValues[env]"
                            true-value="true"
                            false-value="false"
                            v-if="entry.decl.type === 'boolean'"/>
                        <a @click="editValues[env] = null"
                            title="Remove value"
                            class="settings-entry__edit-link">
                            <i class="fas fa-times"></i>
                        </a>
                    </template>
                </div>

                <div class="settings-entry__edit-buttons">
                    <button @click="applyChanges()"
                        class="button button--primary button--small">
                        <span>Save</span>
                    </button>
                    <a @click="toggleEditing()"
                        title="Discard changes">
                        discard changes
                    </a>
                </div>

            </template>

            <template v-else>
                <div class="settings-entry__val"
                    v-for="val of entry.values">
                    <span v-if="val.env"
                        class="badge badge--small"
                        :class="'badge--' + val.env">{{ val.env }}</span>
                    <span v-if="isSecret">
                        ••••••
                    </span>
                    <span v-else>
                        {{ val.value }}
                    </span>
                </div>

                <div class="settings-entry__default-value"
                    v-if="!entry.values.length">
                    <span class="settings-entry__missing-value"
                        v-if="entry.decl.defaultValue == null">
                        missing value
                    </span>
                    {{ entry.decl.defaultValue }}
                </div>
            </template>

        </div>

        <div class="setting-entry__controls">
            <a v-if="!editing"
                @click="toggleEditing()">
                <i class="fas fa-pencil-alt"></i>
            </a>
        </div>

    </div>
</template>

<script>
import { SettingsController } from '~/controllers';

export default {

    data() {
        return {
            editing: false,
            editValues: {},
        };
    },

    props: {
        entry: { type: Object, required: true },
    },

    computed: {

        settings() {
            return this.get(SettingsController);
        },

        viewport() {
            return this.app.viewports.settings;
        },

        isSecret() {
            const suffixes = ['_KEY', '_SECRET', '_TOKEN'];
            return suffixes.some(s => this.entry.decl.key.includes(s));
        },

        defaultValue() {
            const type = this.entry.decl.type;
            switch (type) {
                case 'number': return '0';
                case 'boolean': return 'false';
                default: return '';
            }
        }

    },

    methods: {

        toggleEditing() {
            this.resetEditValues();
            this.editing = !this.editing;
        },

        applyChanges() {
            const key = this.entry.decl.key;
            const entries = [
                [key, this.editValues.default],
                [key + ':staging', this.editValues.staging],
                [key + ':production', this.editValues.production],
            ];
            this.settings.setEntries(entries);
            this.resetEditValues();
            this.editing = false;
        },

        resetEditValues() {
            this.editValues = {
                default: null,
                staging: null,
                production: null,
            };
            for (const v of this.entry.values) {
                const k = v.env || 'default';
                this.editValues[k] = v.value == null ? null : String(v.value);
            }
        },

    }

};
</script>

<style>
.setting-entry__key {
    flex: 0 0 40%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.setting-entry__values {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.setting-entry__controls {
    flex: 0 0 auto;
}

.settings-entry__default-value {
    color: var(--color-cool--500);
}

.settings-entry__missing-value {
    color: var(--color-red--500);
}

.settings-entry__val {
    margin: 2px 0;
}

.settings-entry__edit-buttons {
    margin-top: var(--gap);
}

.settings-entry__edit-row {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    margin-bottom: 2px;
}

.settings-entry__edit-env {
    flex: 0 0 96px;
    margin-right: 2px;
    height: var(--control-height--small);
}

.settings-entry__edit-val {
    flex: 1;
}

.settings-entry__edit-link {
    margin-left: 4px;
}
</style>
