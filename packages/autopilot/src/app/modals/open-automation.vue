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
                            <service-select
                                :service="service"
                                @change="onServiceSelect">
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
                    <div class="form-row" v-if="!openActive">
                        <div class="form-row__label">
                            Script version
                        </div>
                        <div class="form-row__controls">
                            <select v-model="scriptId" class="input stretch">
                                <option v-if="scripts.length === 0"
                                    :value="null"> No script found </option>
                                <option v-else
                                    :value="null"> Version </option>
                                <option
                                    v-for="script of scripts"
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
import ServiceSelect from '../components/service-select.vue';

export default {
    inject: [
        'saveload',
        'project',
        'apiLogin',
        'api',
    ],

    components: {
        ServiceSelect,
    },

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
    },

    watch: {
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
