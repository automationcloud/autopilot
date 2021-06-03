<template>
    <div class="modal">
        <div class="modal__header">
            {{ modalTitle }}
        </div>
        <div class="modal__body">
            <div>
                <div class="section__title">
                    Location
                    </div>
                <div class="form-row">
                    <div class="form-row__controls">
                        <input
                            class="input"
                            type="radio"
                            id="location-ac"
                            value="ac"
                            v-model="location" />

                        <label
                            class="form-row__label"
                            for="location-ac">
                            Automation Cloud
                        </label>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-row__controls">
                        <input
                            type="radio"
                            class="input"
                            id="location-file"
                            value="file"
                            v-model="location" />
                        <label
                            class="form-row__label"
                            for="location-file">
                            Your computer
                        </label>
                    </div>
                </div>
            </div>
            <div v-show="location === 'ac'">
                <signin-warning message="to open service from the Automation Cloud" />
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
                                :searchable="true">
                            </advanced-select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-row__controls">
                            <label>
                                <input type="checkbox" v-model="openActive">
                                Open active version
                            </label>
                        </div>
                    </div>
                    <div v-if="!openActive"
                        class="form-row" >
                        <div class="form-row__label">
                            Version
                        </div>
                        <div class="form-row__controls">
                            <advanced-select
                                @change="onScriptSelect"
                                :options="scriptOptions"
                                :selectedOption="selectedScriptOption"
                                placeholder="Select Version">
                            </advanced-select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal__buttons group group--gap">
            <button class="button button--alt button--tertiary"
                @click="$emit('hide')" >
                Cancel
            </button>
            <button v-if="location === 'ac'"
                class="button button--alt  button--primary"
                :disabled="!canOpenFromAc"
                @click="openFromAc()">
                Open
            </button>

            <button v-if="location === 'file'"
                class="button button--alt button--primary"
                :disabled="loading"
                @click="openFromFile()">
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
        'project',
        'apiLogin',
        'api',
    ],

    data() {
        return {
            location: this.saveload.location || 'ac',
            service: null,
            scriptId: null,
            openActive: true,
            services: [],
            scripts: [],
            loading: false,
        };
    },

    computed: {
        userName() {
            return this.apiLogin.accountFullName;
        },
        isAuthenticated() {
            return this.apiLogin.isAuthenticated();
        },
        canOpenFromAc() {
            return this.scriptId && !this.loading;
        },
        modalTitle() {
            return this.saveload.loadAsDiffBase ? 'Load as diff base' : 'Open';
        },
        scriptOptions() {
            return this.scripts.map(script => this.getScriptOption(script));
        },
        selectedScriptOption() {
            return this.scriptOptions.find(_ => _.id === this.scriptId);
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

        async service(val) {
            if (val) {
                this.scriptId = val.scriptId;
                await this.loadScripts(val.id);
            } else {
                this.scriptId = null;
                this.scripts = [];
            }
        },

        openActive(val) {
            if (val) {
                this.scriptId = this.service.scriptId;
            }
        }
    },

    async created() {
        const { serviceId } = this.project.automation.metadata;
        if (serviceId && this.isAuthenticated) {
            await this.loadServices();
            await this.loadService(serviceId);
        }
    },

    methods: {
        async openFromAc() {
            if (!this.service || !this.scriptId) {
                return;
            }
            this.loading = true;
            try {
                await this.saveload.openAutomationFromAc(this.service.id, this.scriptId);
                this.$emit('hide');
            } catch (error) {
                this.showError(error);
            }
            this.loading = false;
        },

        async openFromFile() {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Open Service',
                filters: [
                    { name: 'Service', extensions: ['automation', 'ubscript', 'json', 'json5'] },
                    { name: 'All Files', extensions: ['*'] },
                ],
            });
            const filepath = filePaths[0] || '';
            if (!filepath) {
                return;
            }
            this.loading = true;
            try {
                await this.saveload.openAutomationFromFile(filepath);
                this.$emit('hide');
            } catch (error) {
                this.showError(error);
            }
            this.loading = false;
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

        async loadService(serviceId) {
            try {
                this.service = await this.api.getService(serviceId);
            } catch (error) {
                this.showError(error);
            }
        },

        onServiceSelect(service) {
            this.service = service;
        },

        onScriptSelect(script) {
            this.scriptId = script.id;
        },

        showError(error) {
            this.saveload.showError('Open', error);
        },

        getScriptOption(script) {
            const note = script.note || 'no note';
            const html = `<b>${script.fullVersion} ${script.id === this.service.scriptId ? '(active)' : ''} </b> &nbsp; ${note}`;
            return {
                id: script.id,
                name: `${script.fullVersion} ${note}`,
                html
            };
        }
    },
};
</script>
