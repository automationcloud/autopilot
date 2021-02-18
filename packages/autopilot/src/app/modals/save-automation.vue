<template>
    <div class="modal">
        <div class="modal__header">
            Save As
        </div>
        <div class="modal__body">
            <div class="section">
                <div class="section__title">Location</div>
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
                            v-model="location"
                            type="radio"
                            id="location-file"
                            value="file" />
                        <label class="form-row__label"
                            for="location-file">
                            Your computer
                        </label>
                    </div>
                </div>
            </div>
            <div v-show="location === 'ac'">
                <signin-warning message="to save and run automations in the Automation Cloud" />
                <div v-if="isAuthenticated">
                    <div class="box box--light">
                        Signed-in as {{ userName }}
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                            Automation
                        </div>
                        <div class="form-row__controls">
                            <advanced-select
                                @change="onServiceSelect"
                                @search="search => loadServices(search)"
                                :options="services"
                                :selected-option="service"
                                :searchable="true"
                                placeholder="Create new automation">
                            </advanced-select>
                            <span class="inline-message">
                                <i class="fas fa-exclamation-circle"></i>
                                An Automation contains versions and is what you call from the Automation Cloud API.
                            </span>
                        </div>
                    </div>
                    <div v-if="serviceIdMismatch"
                        class="box box--yellow box--small">
                        <strong>Warning!</strong>
                        You are saving your script to a different automation, <strong>{{ service && service.name }}</strong>.
                        It will update the automation name to {{ metadata.serviceName }}.
                        Proceed at your own risk.
                    </div>
                    <div v-if="!service"
                        class="form-row">
                        <div class="form-row__label">
                            Name
                        </div>
                        <div class="form-row__controls">
                            <input class="input" type="text" v-model="newServiceName" />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                            Version
                        </div>
                        <div class="form-row__controls">
                            <select class="select stretch"
                                v-model="release">
                                <option value="patch"> Increment patch version to {{ getVersion('patch') }} </option>
                                <option value="minor"> Increment minor version to {{ getVersion('minor') }} </option>
                                <option value="major"> Increment major version to {{ getVersion('major') }} </option>
                                <option value="custom"> Manually assign version </option>
                            </select>
                        </div>
                    </div>
                    <div v-if="release === 'custom'"
                         class="form-row">
                        <div class="form-row__label"></div>
                        <div>
                            <input class="input"
                                type="text"
                                v-model="fullVersion"/>
                        </div>
                    </div>
                    <div class="expand clickable"
                        @click="expandAdvanced = !expandAdvanced">
                        <i class="fas"
                            :class="{
                                'fa-caret-right': !expandAdvanced,
                                'fa-caret-down': expandAdvanced
                            }">
                        </i>
                        <span>Advanced</span>
                    </div>
                    <div v-if="expandAdvanced">
                        <div class="form-row">
                            <div class="form-row__label">
                                Worker tag
                            </div>
                            <div class="form-row__controls">
                                <input class="input stretch"
                                    v-model="workerTag"/>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-row__label"
                                style="align-self: flex-start;">
                                Note
                            </div>
                            <div class="form-row__controls">
                                <textarea class="textarea"
                                    v-model="note"
                                    rows="6">
                                </textarea>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-row__controls">
                                <label>
                                    <input type="checkbox" v-model="activate">
                                    Make version active
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal__buttons group group--gap">
            <button class="button button--alt button--tertiary"
                @click="$emit('hide')">
                Cancel
            </button>
            <button  v-if="location === 'ac'"
                class="button button--alt button--primary"
                @click="saveToAc()"
                :disabled="!canSaveToAc">
                Save
            </button>
            <button v-if="location === 'file'"
                class="button button--alt button--primary"
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
import AdvancedSelect from '../components/advanced-select.vue';

export default {
    components: {
        AdvancedSelect,
    },

    inject: [
        'saveload',
        'project',
        'apiLogin',
        'api',
    ],

    data() {
        return {
            location: this.saveload.location || 'ac',
            service: null,
            newServiceName: this.project.automation.metadata.serviceName,
            customVersion: '0.0.1',
            workerTag: 'stable',
            note: '',
            release: 'patch',
            activate: false,
            services: [],
            scripts: [],
            expandAdvanced: false,
        };
    },

    computed: {
        metadata() {
            return this.project.automation.metadata;
        },
        userName() {
            return this.apiLogin.accountFullName;
        },
        isAuthenticated() {
            return this.apiLogin.isAuthenticated();
        },
        isVersionValid() {
            return semver.valid(this.fullVersion);
        },
        canSaveToAc() {
            return this.isAuthenticated && this.isVersionValid && (this.service || this.newServiceName);
        },
        latestVersion() {
            return this.scripts[0] ? this.scripts[0].fullVersion : '0.0.0';
        },
        serviceIdMismatch() {
            return this.service && this.service.id !== this.metadata.serviceId;
        },
        fullVersion: {
            get() {
                if (this.release === 'custom') {
                    return this.customVersion;
                }
                return this.getVersion(this.release);
            },
            set(val) {
                this.customVersion = val;
            }
        }
    },

    watch: {
        isAuthenticated(val) {
            if (val) {
                this.loadServices();
                const { serviceId } = this.project.automation.metadata;
                this.loadService(serviceId);
            } else {
                this.service = null;
            }
        },

        service(val) {
            if (val) {
                this.loadScripts(val.id);
            } else {
                this.scripts = [];
            }
        },
    },

    async mounted() {
        const { serviceId } = this.project.automation.metadata;
        if (serviceId && this.isAuthenticated) {
            await this.loadServices();
            await this.loadService(serviceId);
        }
    },

    methods: {
        async saveToAc() {
            if (!this.service) {
                this.service = await this.saveload.createService(this.newServiceName);
            }
            try {
                await this.saveload.saveAutomationToAc({
                    service: this.service,
                    fullVersion: this.fullVersion,
                    workerTag: this.workerTag,
                    activate: this.activate,
                    note: this.note,
                });
                this.$emit('hide');
            } catch (error) {
                console.warn(error);
                this.showError(error);
            }
        },

        async saveToFile() {
            const { filePath } = await dialog.showSaveDialog({
                title: 'Save Automation',
                filters: [
                    { name: 'Automation', extensions: ['automation'] },
                ],
                defaultPath: this.saveload.filePath || `${this.newServiceName}.automation`,
            });
            if (filePath == null) {
                return;
            }
            try {
                await this.saveload.saveAutomationToFile(filePath);
                this.$emit('hide');
            } catch (error) {
                console.warn(error);
                this.showError(error);
            }
        },

        getVersion(release) {
            return semver.inc(this.latestVersion, release);
        },

        async loadService(serviceId) {
            try {
                this.service = await this.api.getService(serviceId);
            } catch (error) {
                console.warn('failed to load service', error);
            }

        },

        async loadServices(name = '') {
            try {
                this.services = await this.api.getServices({ name, archived: false });
            } catch (error) {
                this.services = [];
            }
        },

        async loadScripts(serviceId) {
            if (serviceId) {
                try {
                    this.scripts = await this.saveload.getScripts(serviceId);
                } catch (error) {
                    console.warn('failed to load scripts');
                    this.scripts = [];
                }
            }
        },

        onServiceSelect(service) {
            this.service = service;
        },

        showError(error) {
            this.saveload.showError('Save', error);
        }
    },
};
</script>

<style scoped>
.inline-message {
    font-style: italic;
    font-size: 10px;
    color: var(--color-cool--600);
    line-height: 1.2em;
    padding: var(--gap) 2px;
    display: grid;
    grid-template-columns: auto auto;
    grid-gap: 2px;
}

.expand {
    margin: var(--gap--large) 0px var(--gap) 0px;
    padding: var(--gap--large) 0px var(--gap) 0px;
    font-size: var(--font-size--small);
}
</style>
