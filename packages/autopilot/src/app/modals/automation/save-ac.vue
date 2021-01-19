<template>
    <div>
        <signin-warning
            message="to save and run automations in the Automation Cloud" />
        <div v-if="isAuthenticated">
            <div class="box box--yellow"> Signed in as {{ userName }} </div>

            <div class="form-row">
                <div class="form-row__label">
                    Automation
                </div>

                <div class="form-row__controls">
                    <select v-model="serviceId">
                        <option :value="null"> Create new Automation </option>
                        <option
                            v-for="service of services"
                            :key="service.id"
                            :value="service.id">
                            {{ service.name }}
                        </option>
                    </select>
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
                    Version
                </div>
                <div class="form-row__controls">
                    <input class="input" type="text" v-model="version" />
                    <div v-if="latestVersion">latest version: {{ latestVersion }}</div>

                </div>
            </div>
        </div>

        <div class="modal__buttons">
            <button class="button button--outlined-primary"
                @click="$emit('hide')">
                Cancel
            </button>
            <button class="button button--primary"
                @click="save()"
                :disabled="!canSave">
                Save
            </button>
        </div>
    </div>
</template>

<script>
import * as semver from 'semver';
export default {
    inject: [
        'saveload',
        'project',
        'apiLogin',
        'acAutomation',
    ],

    data() {
        const { serviceId, version, serviceName } = this.project.automation.metadata;
        return {
            serviceId,
            version: version || '1.0.0',
            automationName: serviceName || null,
            createNew: serviceId == null,
        };
    },

    created() {
        this.acAutomation.getServices();
        if (this.serviceId) {
            this.acAutomation.getScripts(this.serviceId);
        }
    },

    watch: {
        serviceId() {
            if (this.serviceId) {
                this.acAutomation.getScripts(this.serviceId);
            }
        },
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
        isVersionValid() {
            return semver.valid(this.version);
        },
        canSave() {
            return this.isAuthenticated &&
                this.isVersionValid && (this.createNew ? this.automationName : this.serviceId);
        },
        services() {
            return this.acAutomation.services;
        },
        latestVersion() {
            return this.acAutomation.scripts[0] ? this.acAutomation.scripts[0].fullVersion : null;
        }
    },

    methods: {
        async save() {
            if (this.createNew) {
                const { id } = await this.acAutomation.createService(this.automationName);
                this.serviceId = id;
            }
            try {
                await this.saveload.saveProjectToAc(this.serviceId, this.version);
                this.$emit('hide');
            } catch (error) {
                console.error(error);
                // display error;
                alert('Failed to save your Automation');
            }
        },
    },
};
</script>
