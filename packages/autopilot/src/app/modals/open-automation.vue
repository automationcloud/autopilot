<template>
    <div class="modal">
        <div class="modal__header font-family--alt"> Open </div>
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
                <signin-warning message="to open automation from the Automation Cloud" />
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
        </div>
        <div class="actions automation-cloud">
            <button class="button button--tertiary"
                @click="$emit('hide')">
                Cancel
            </button>
            <button
                v-if="location === 'ac'"
                class="button button--primary"
                @click="openFromAc()"
                :disabled="!canOpenFromAc">
                Open
            </button>

            <button
                v-if="location === 'file'"
                class="button button--primary"
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
        'acAutomation',
    ],
    data() {
        const { serviceId } = this.project.automation.metadata;
        return {
            location: this.saveload.location || 'ac',
            serviceId,
            scriptId: null,
            openActive: true,
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
        isAuthenticated() {
            return this.apiLogin.isAuthenticated();
        },
        canOpenFromAc() {
            return this.serviceId && (this.scriptId || this.openActive);
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
                await this.saveload.openProjectFromFile(filepath);
                this.$emit('hide');
            } catch (error) {
                console.warn('failed to load automation', error);
                // TODO: use newe spec for error
                alert('Failed to open Automation');
            }
        }
    },
};
</script>
<style scoped>
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
