<template>
    <div class="modal">
        <div class="modal__header">
            Save as
        </div>
        <div class="modal__body" style="max-width: 400px;">
            Location
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

            <div name="account-info">
                <div v-if="location === 'ac'">
                    <signin-warning message="to save and run automations in the Automation Cloud"/>
                    <div v-show="isAcSignedIn">
                        <span> Signed in as {{ userName }} </span>
                        <div class="form-row">
                            <div class="form-row__label">
                                Automation
                            </div>
                            <div class="form-row__controls">
                                <select class="input"
                                    type="radio"
                                    id="location-file"
                                    v-model="serviceId"
                                    value="file">
                                    <option v-for="s of services"
                                        :key="s.id"
                                        :value="s.id"> {{ s.name }}
                                    </option>
                                </select>>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    inject: [
        'saveload',
        'apiLogin',
        'acAutomation'
    ],

    data() {
        return {
            location: this.saveload.location || 'ac',
        };
    },

    computed: {
        userName() {
            return this.apiLogin.accountFullName;
        },

        isAcSignedIn() {
            return this.apiLogin.isAuthenticated();
        }
    },

    methods: {
        async getServices() {
            await this.acAutomation.getSerivces();
        }
    },
};
</script>
