<template>
    <div>
        <signin-warning
            message="to save and run automations in the Automation Cloud" />
        <div v-if="isAuthenticated">
            <div class="box box--yellow"> Signed in as {{ userName }} </div>

            <select v-model="serviceId">
                <option :value="null"> Create new Automation </option>
                <option v-show="serviceId" :value="serviceId">
                    {{ automation.metadata.serviceName }}
                </option>
            </select>

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
                    Script version
                </div>
                <div class="form-row__controls">
                    <input class="input" type="text" v-model="version" />
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
    name: 'save-ac',

    inject: [
        'saveload',
        'project',
        'apiLogin',
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
        }
    },

    methods: {
        async save() {
            if (this.createNew) {
                const { id } = await this.saveload.createService(this.automationName);
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
