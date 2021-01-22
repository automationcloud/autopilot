<template>
    <div class="modal">
        <div class="modal__header font-family--alt">
            Save As
        </div>
        <div class="modal__body">
            <div>
                <div class="location-header">Location</div>
                <div class="form-row">
                    <div class="form-row__controls">
                        <input class="input"
                            type="radio"
                            id="location-ac"
                            v-model="location"
                            value="ac"/>

                        <label class="form-row__label"
                            for="location-ac">
                            Automation Cloud
                        </label>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-row__controls">
                        <input class="input"
                            type="radio"
                            id="location-file"
                            v-model="location"
                            value="file"/>
                        <label class="form-row__label"
                            for="location-file">
                            Your computer
                        </label>
                    </div>
                </div>
            </div>
            <div v-if="location === 'ac'">
                <signin-warning message="to save and run automations in the Automation Cloud" />
                <div v-if="isAuthenticated">
                    <div
                        class="box font-family--alt"
                        style="background: var(--color-cool--200);">
                        Signed-in as {{ userName }} </div>

                    <div class="form-row">
                        <div class="form-row__label">
                            Automation
                        </div>

                        <div class="form-row__controls">
                            <select v-model="serviceId" class="input stretch" id="select-automation">
                                <option :value="null"> Create new Automation </option>
                                <option
                                    v-for="service of services"
                                    :key="service.id"
                                    :value="service.id">
                                    {{ service.name }}
                                </option>
                            </select>
                            <span class="inline-message">
                                <i class="fas fa-exclamation-circle"></i>
                                An Automation contains versions and is what you call from the Automation Cloud API.
                            </span>
                        </div>
                    </div>

                    <div v-if="!serviceId"
                        class="form-row">
                        <div class="form-row__label">
                            Name
                        </div>
                        <div class="form-row__controls">
                            <input class="input" type="text" v-model="automationName" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-row__label">
                            Script Version
                        </div>
                        <div class="form-row__controls">
                            <input
                                class="input input--inline"
                                style="justify-self: stretch;"
                                type="text"
                                v-model="version"
                                :readonly="release !== 'custom'" />
                            <select class="input input--inline" v-model="release">
                                <option value="major">major</option>
                                <option value="minor">minor</option>
                                <option value="patch">patch</option>
                                <option value="custom">custom</option>
                            </select>
                            <div v-if="latestVersion" class="inline-message">latest version: {{ latestVersion }} </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="actions automation-cloud">
            <button class="button button--tertiary"
                @click="$emit('hide')">
                Cancel
            </button>
            <button
                v-if="location === 'ac'"
                class="button button--primary"
                @click="saveToAc()"
                :disabled="!canSaveToAc">
                Save
            </button>
            <button
                v-if="location === 'file'"
                class="button button--primary"
                @click="saveToFile()">
                Save File
            </button>
        </div>
    </div>
</template>

<script>
import * as semver from 'semver';
import { remote } from 'electron';
const { dialog } = remote;

export default {
    inject: [
        'saveload',
        'project',
        'apiLogin',
        'acAutomation',
    ],

    data() {
        const { serviceId } = this.project.automation.metadata;
        return {
            location: this.saveload.location || 'ac',
            serviceId,
            version: this.getVersion(),
            automationName: null,
            createNew: serviceId == null,
            release: 'patch',
        };
    },

    created() {
        this.acAutomation.getServices();
        if (this.serviceId) {
            this.acAutomation.getScripts(this.serviceId);
        }
    },

    watch: {
        serviceId(newVal) {
            if (newVal) {
                this.acAutomation.getScripts(this.serviceId);
            } else {
                this.acAutomation.scripts = [];
            }
        },

        release(newVal) {
            if (['major', 'minor', 'patch'].includes(newVal)) {
                this.version = this.getVersion();
            }
        },

        latestVersion() {
            this.version = this.getVersion();
        }
    },

    computed: {
        userName() {
            return this.apiLogin.accountFullName;
        },
        isAuthenticated() {
            return this.apiLogin.isAuthenticated();
        },
        services() {
            return this.acAutomation.services;
        },
        isVersionValid() {
            return semver.valid(this.version);
        },
        canSaveToAc() {
            return this.isAuthenticated && this.isVersionValid && (this.createNew ? this.automationName : this.serviceId);
        },
        latestVersion() {
            return this.acAutomation.scripts[0] ? this.acAutomation.scripts[0].fullVersion : null;
        },
    },

    methods: {
        async saveToAc() {
            if (this.createNew) {
                const { id } = await this.acAutomation.createService(this.automationName);
                this.serviceId = id;
            }
            try {
                await this.saveload.saveProjectToAc(this.serviceId, this.version);
                this.$emit('hide');
            } catch (error) {
                console.warn(error);
                alert('Failed to save your Automation');
            }
        },

        async saveToFile() {
            const { filePath } = await dialog.showSaveDialog({
                title: 'Save Automation',
                filters: [
                    { name: 'Automation', extensions: ['automation'] },
                ],
                defaultPath: this.saveload.filePath || 'my-awesome-automation.automation',
            });
            if (filePath == null) {
                return;
            }
            try {
                await this.saveload.saveProjectToFile(filePath);
                this.$emit('hide');
            } catch (error) {
                console.warn(error);
                alert('Failed to save your Automation');
            }
        },

        getVersion() {
            if (['major', 'minor', 'patch'].includes(this.release) && this.latestVersion) {
                return semver.inc(this.latestVersion, this.release);
            }
            return '1.0.0';
        }
    },
};
</script>
<style scoped>
.inline-message {
    font-style: italic;
    font-size: 10px;
    line-height: 1.2em;
    padding: var(--gap) 2px;
    display: grid;
    grid-template-columns: auto auto;
    grid-gap: 2px;
}

.location-header {
    font-family: var(--font-family--alt);
    font-size: 1.6em;
    margin-bottom: var(--gap--large);
}

.actions {
    background: var(--color-cool--100);
    padding: var(--gap) 0;
    display: flex;
    justify-content: flex-end;
}

.actions .button {
    font-weight: 500;
    font-size: 1.4em;
}
</style>
