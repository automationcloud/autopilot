<template>
    <div class="modal">
        <div class="modal__header">
            Open
        </div>
        <div class="modal__body">
            <div>
                <div class="section__title">
                    Location
                    </div>
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
                            <select v-model="serviceId" class="input stretch">
                                <option v-if="services.length === 0"> No Automation found </option>
                                <option v-else
                                    :value="null"> Select Automation </option>
                                <option
                                    v-for="service of services"
                                    :key="service.id"
                                    :value="service.id">
                                    {{ service.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                           Open active version
                        </div>
                        <div class="form-row__controls">
                            <input type="checkbox" v-model="openActive">
                        </div>
                    </div>
                    <div class="form-row" v-if="!openActive">
                        <div class="form-row__label">
                            Script version
                        </div>
                        <div class="form-row__controls">
                            <select v-model="scriptId" class="input stretch">
                                <option v-if="scripts.length === 0"
                                    :value="null"> No script found </option>
                                <option v-else
                                    :value="null"> Select version </option>
                                <option
                                    v-for="script of scripts"
                                    :key="script.id"
                                    :value="script.id">
                                    {{ script.fullVersion }} - {{ new Date(script.createdAt) }}
                                </option>
                            </select>
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
                class="button button--alt  button--primary"
                @click="openFromAc()"
                :disabled="!canOpenFromAc">
                Open
            </button>

            <button
                v-if="location === 'file'"
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

export default {
    inject: [
        'saveload',
        'project',
        'apiLogin',
    ],
    data() {
        const { serviceId } = this.project.automation.metadata;
        return {
            location: this.saveload.location || 'ac',
            serviceId,
            scriptId: null,
            openActive: true,
            services: [],
            scripts: [],
        };
    },

    created() {
        this.loadServices();
    },

    watch: {
        isAuthenticated(val) {
            if (val) {
                this.loadServices();
            }
        },
        serviceId(val) {
            this.scriptId = null;
            if (!this.openActive && val) {
                this.loadScripts(this.serviceId);
            } else {
                this.scripts = [];
            }
        },
        openActive(val) {
            if (!val && this.serviceId) {
                this.loadScripts(this.serviceId);
            } else {
                this.scripts = [];
            }
        }
    },

    computed: {
        userName() {
            return this.apiLogin.accountFullName;
        },
        isAuthenticated() {
            return this.apiLogin.isAuthenticated();
        },
        canOpenFromAc() {
            return this.serviceId && (this.scriptId || this.openActive);
        },
    },

    methods: {
        async openFromAc() {
            const scriptId = this.openActive ?
                await this.saveload.getActiveScriptId(this.serviceId) :
                this.scriptId;
            if (!scriptId) {
                return;
            }
            try {
                await this.saveload.openAutomationFromAc(this.serviceId, scriptId);
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

        async loadServices() {
            try {
                this.services = await this.saveload.getServices();
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
        }
    },
};
</script>
