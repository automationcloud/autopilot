<template>
    <save-load @hide="$emit('hide')">
        <template v-slot:title>
            <span>Open</span>
        </template>

        <template v-slot:main="mainProps">
            <div v-if="mainProps.location === 'ac'">
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
                            <select v-model="serviceId" class="input stretch">
                                <option :value="null"> Select Automation </option>
                                <option
                                    v-for="service of services"
                                    :key="service.id"
                                    :value="service.id">
                                    {{ service.name }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <label class="form-row">
                        <input type="checkbox" v-model="openActive">
                        Open active version
                    </label>

                    <div class="form-row" v-if="!openActive">
                        <div class="form-row__label">
                            Script version
                        </div>
                        <div class="form-row__controls">
                            <select v-model="scriptId" class="input stretch">
                                <option :value="null"> Select version </option>
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
        </template>

        <template v-slot:action="actionProps">
            <button
                v-if="actionProps.location === 'ac'"
                class="button button--primary"
                @click="openFromAc(actionProps.location)"
                :disabled="!canOpenFromAc">
                Open
            </button>

            <button
                v-if="actionProps.location === 'file'"
                class="button button--primary"
                @click="openFromFile()">
                Select file
            </button>
        </template>
    </save-load>
</template>

<script>
import SaveLoad from './automation/saveload.vue';
import { remote } from 'electron';
const { dialog } = remote;

export default {
    inject: [
        'saveload',
        'project',
        'apiLogin',
        'acAutomation',
    ],
    components: {
        SaveLoad
    },

    data() {
        const { serviceId } = this.project.automation.metadata;
        return {
            serviceId,
            openActive: true,
            scriptId: null,
        };
    },

    created() {
        this.acAutomation.getServices();
    },

    watch: {
        serviceId() {
            if (!this.openActive && this.serviceId) {
                this.acAutomation.getScripts(this.serviceId);
            }
        },
        openActive(val) {
            if (!val && this.serviceId) {
                this.acAutomation.getScripts(this.serviceId);
            }
        }
    },

    computed: {
        userName() {
            return this.apiLogin.accountFullName;
        },
        automation() {
            return this.project.automation;
        },
        isAuthenticated() {
            return this.apiLogin.isAuthenticated();
        },
        canOpenFromAc() {
            return this.serviceId &&  this.scriptId || this.openActive;
        },
        services() {
            return this.acAutomation.services;
        },
        scripts() {
            return this.acAutomation.scripts;
        }
    },

    methods: {
        async openFromAc() {
            const scriptId = this.openActive ?
                await this.acAutomation.getActiveScriptId(this.serviceId) :
                this.scriptId;
            if (!scriptId) {
                return;
            }
            try {
                await this.saveload.openProjectFromAc(scriptId);
                this.$emit('hide');
            } catch (error) {
                console.error(error);
                // display error;
                alert('Failed to open your Automation');
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
                await this.saveload.openProjectFromFile(filepath);
                this.$emit('hide');
            } catch (error) {
                console.error('failed to load project', error);
            }
        }

    },
};
</script>
