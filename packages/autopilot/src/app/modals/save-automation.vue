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
                <signin-warning message="to save and run services in the Automation Cloud" />
                <div v-if="isAuthenticated">
                    <div class="box box--light">
                        Signed-in as {{ userName }}
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                            Service
                        </div>
                        <div class="form-row__controls">
                            <advanced-select
                                @change="onServiceSelect"
                                @search="search => loadServices(search)"
                                :options="services"
                                :selected-option="service"
                                :searchable="true"
                                placeholder="Create new Service">
                            </advanced-select>
                        </div>
                    </div>
                    <div v-if="serviceIdMismatch"
                        class="box box--yellow box--small">
                        <strong>Warning!</strong>
                        You are saving your script to a different service, <strong>{{ service && service.name }}</strong>.
                        It will update the service name to {{ metadata.serviceName }}.
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

                    <div v-if="versionWarningShown"
                        class="box box--primary group group--gap">
                        <i class="fas fa-exclamation-circle"
                            style="align-self: flex-start; margin-top: var(--gap--small);"></i>
                        <div>
                            <b>A more recent version of this Service has been saved since your edits were made.</b>
                            <p>Note: <i>{{ latestScript && latestScript.note || 'Note not provided.' }}</i></p>
                            You may wish to compare this version with yours before you Save.
                            <div style="display: flex; justify-content: flex-end; margin-top: var(--gap);">
                                <button
                                    class="button button--alt button--secondary"
                                    @click.prevent="loadAsDiff">
                                    Load recent version as Diff base</button>
                            </div>
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
                {{ versionWarningShown ? 'Save anyway' : 'Save'  }}
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

export default {

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
            scriptLoading: false,
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
        latestScript() {
            return this.scripts[0] || null;
        },
        latestVersion() {
            return this.latestScript ? this.latestScript.fullVersion : '0.0.0';
        },
        versionWarningShown() {
            return this.service && !this.scriptLoading && this.metadata.version !== this.latestVersion;
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

    async created() {
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
                title: 'Save Service',
                filters: [
                    { name: 'Service', extensions: ['automation'] },
                ],
                defaultPath: this.saveload.filePath || `${this.newServiceName}.automation`,
            });
            if (!filePath) {
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
            this.scriptLoading = true;
            if (serviceId) {
                try {
                    this.scripts = await this.saveload.getScripts(serviceId);
                } catch (error) {
                    console.warn('failed to load scripts');
                    this.scripts = [];
                } finally {
                    this.scriptLoading = false;
                }
            }
        },

        onServiceSelect(service) {
            this.service = service;
        },

        showError(error) {
            this.saveload.showError('Save', error);
        },

        async loadAsDiff() {
            this.saveload.loadAsDiffBase = true;
            const latestScript = this.scripts[0];
            if (!this.service || !latestScript) {
                this.showError(new Error('Service or valid version not found'));
                return;
            }
            try {
                await this.saveload.openAutomationFromAc(this.service.id, latestScript.id);
                this.$emit('hide');
            } catch (error) {
                this.showError(error);
            }
        }
    },
};
</script>

<style scoped>

.expand {
    margin: var(--gap--large) 0px var(--gap) 0px;
    padding: var(--gap--large) 0px var(--gap) 0px;
    font-size: var(--font-size--small);
}
</style>
