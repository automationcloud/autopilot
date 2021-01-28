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
                    <div class="box box--light">
                        Signed-in as {{ userName }}
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                            Automation
                        </div>
                        <div class="form-row__controls">
                            <service-select
                                :serviceId="serviceId"
                                :addNullOption="true"
                                nullPlaceholder="Create New Automation"
                                @change="onServiceChange"></service-select>
                            <span class="inline-message">
                                <i class="fas fa-exclamation-circle"></i>
                                An Automation contains versions and is what you call from the Automation Cloud API.
                            </span>
                        </div>
                    </div>
                    <div class="box box--yellow box--small"
                            v-if="namesMismatch">
                        <strong>Warning!</strong>
                        Selected automation name <strong>{{ serviceName }}</strong> does not match
                        current automation name <strong>{{ metadata.serviceName }}</strong>.
                        it will update the service name to {{ metadata.serviceName }}.
                        Proceed at your own risk.
                    </div>
                    <div v-if="!serviceId"
                        class="form-row">
                        <div class="form-row__label">
                            Name
                        </div>
                        <div class="form-row__controls">
                            <input class="input" type="text" v-model="serviceName" />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                            Script Version
                        </div>
                        <div class="form-row__controls group group--gap">
                            <input
                                class="input"
                                type="text"
                                v-model="fullVersion"
                                :readonly="release !== 'custom'" />
                            <select class="input" v-model="release">
                                <option value="major">major</option>
                                <option value="minor">minor</option>
                                <option value="patch">patch</option>
                                <option value="custom">custom</option>
                            </select>
                        </div>
                    </div>
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
                        <div class="form-row__label">
                            Make script active
                        </div>
                        <div class="form-row__controls">
                            <input type="checkbox" v-model="activate">
                        </div>
                    </div>
                    <div class="form-block">
                        <div class="form-block__label">
                            Note
                        </div>
                        <div class="form-block__controls">
                            <textarea v-model="note" rows="6" placeholder="Describe your changes"></textarea>
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
            <button
                v-if="location === 'ac'"
                class="button button--alt button--primary"
                @click="saveToAc()"
                :disabled="!canSaveToAc">
                Save
            </button>
            <button
                v-if="location === 'file'"
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
import ServiceSelect from '../components/service-select.vue';

export default {
    inject: [
        'saveload',
        'project',
        'apiLogin',
    ],

    components: {
        ServiceSelect,
    },

    data() {
        const { serviceId, serviceName, version } = this.project.automation.metadata;
        return {
            location: this.saveload.location || 'ac',
            serviceId,
            serviceName,
            customVersion: version,
            workerTag: 'stable',
            note: '',
            release: 'patch',
            activate: false,
            scripts: [],
        };
    },

    created() {
        this.loadScripts(this.serviceId);
    },

    watch: {
        isAuthenticated(val) {
            if (val) {
                this.loadScripts(this.serviceId);
            }
        },

        serviceId(newVal) {
            if (newVal) {
                this.loadScripts(newVal);
            } else {
                this.scripts = [];
            }
        },
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
            return this.isAuthenticated && this.isVersionValid;
        },
        latestVersion() {
            return this.scripts[0] ? this.scripts[0].fullVersion : '0.0.0';
        },
        namesMismatch() {
            return this.serviceId && this.serviceId !== this.metadata.serviceId;
        },
        fullVersion: {
            get() {
                if (this.release === 'custom') {
                    return this.customVersion;
                }
                return semver.inc(this.latestVersion, this.release);
            },
            set(val) {
                this.customVersion = val;
            }
        }
    },

    methods: {
        async saveToAc() {
            if (!this.serviceId) {
                const { id } = await this.saveload.createService(this.serviceName);
                this.serviceId = id;
            }
            try {
                await this.saveload.saveAutomationToAc({
                    serviceId: this.serviceId,
                    seerviceName: this.serviceName,
                    fullVersion: this.fullVersion,
                    workerTag: this.workerTag,
                    activate: this.activate,
                    note: this.note,
                });
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
                defaultPath: this.saveload.filePath || `${this.serviceName}.automation`,
            });
            if (filePath == null) {
                return;
            }
            try {
                await this.saveload.saveAutomationToFile(filePath);
                this.$emit('hide');
            } catch (error) {
                console.warn(error);
                alert('Failed to save your Automation');
            }
        },

        getVersion() {
            if (this.release === 'custom') {
                return this.latestVersion;
            }
            return semver.inc(this.latestVersion, this.release);
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

        onServiceChange(service) {
            if (service) {
                this.serviceId = service.id;
                this.serviceName = service.name;
            } else {
                this.serviceId = null;
                this.serviceName = this.metadata.serviceName;
            }
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
</style>
