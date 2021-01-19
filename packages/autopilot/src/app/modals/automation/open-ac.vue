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
                    Version
                </div>
                <div class="form-row__controls">
                    <select v-model="scriptId">
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

        <div class="modal__buttons">
            <button class="button button--outlined-primary"
                @click="$emit('hide')">
                Cancel
            </button>
            <button class="button button--primary"
                @click="open()"
                :disabled="!canOpen">
                Open
            </button>
        </div>
    </div>
</template>

<script>
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
        canOpen() {
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
        async open() {
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

    },
};
</script>
