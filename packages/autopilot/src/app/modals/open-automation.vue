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
                <signin-warning message="to open automation from the Automation Cloud" />
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
                                @change="onServiceSelect"
                                :service="service" >
                            </service-select>
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
                            Script version
                        </div>
                        <div class="form-row__controls">
                            <select class="select stretch"
                                v-model="scriptId">
                                <option v-if="scripts.length === 0"
                                    :value="null">
                                     No script found
                                </option>
                                <option  v-else
                                    :value="null"> Version </option>
                                <option v-for="script of scripts"
                                    :key="script.id"
                                    :value="script.id">
                                    {{ script.fullVersion }} - {{ formatDate(script.createdAt) || '' }}
                                </option>
                            </select>
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
                @click="openFromFile()">
                Select file
            </button>
        </div>
    </div>
</template>

<script>
import { remote } from 'electron';
const { dialog } = remote;
import ServiceSelect from '../components/service-select.vue';

export default {
    components: {
        ServiceSelect,
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
            scriptId: null,
            openActive: true,
            scripts: [],
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
            return this.scriptId;
        },
        modalTitle() {
            return this.saveload.setDiffBase ? 'Open' : 'Load as diff base';
        }
    },

    watch: {
        isAuthenticated(val) {
            if (val) {
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
    },

    created() {
        const { serviceId } = this.project.automation.metadata;
        if (serviceId && this.isAuthenticated) {
            this.loadService(serviceId);
        }
    },

    methods: {
        async openFromAc() {
            if (!this.service || !this.scriptId) {
                return;
            }
            try {
                await this.saveload.openAutomationFromAc(this.service.id, this.scriptId);
                this.$emit('hide');
            } catch (error) {
                console.warn('failed to load automation', error);
                // TODO: use newe spec for error
                alert('Failed to open Automation');
            }
        },

        async openFromFile() {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Open Automation',
                filters: [
                    { name: 'Automation', extensions: ['automation', 'ubscript', 'json', 'json5'] },
                    { name: 'All Files', extensions: ['*'] },
                ],
            });
            const filepath = filePaths[0] || '';
            if (filepath == null) {
                return;
            }
            try {
                await this.saveload.openAutomationFromFile(filepath);
                this.$emit('hide');
            } catch (error) {
                console.warn('failed to load automation', error);
                // TODO: use newe spec for error
                alert('Failed to open Automation');
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
                console.warn('failed to load service', error);
            }

        },

        formatDate(timestamp) {
            const time = new Date(timestamp);
            return time.toLocaleString('en-GB', {
                timeZoneName: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        },

        onServiceSelect(service) {
            this.service = service;
        }
    },
};
</script>
