<template>
    <modal class="script-update-service-attributes section"
        content-class="modal__content--wide"
        :shown="shown"
        @close="onClose">

        <div class="section__title">
            Update service attributes
        </div>

        <div class="form-block">
            <edit-json v-model="service.attributes"/>
        </div>

        <div class="group group--gap">
            <button class="button"
                @click="populateInputFields">
                replace input fields
            </button>

            <button class="button"
                @click="populateInputKeys">
                replace input keys
            </button>

            <button class="button"
                @click="populateOutputKeys">
                replace output keys
            </button>
        </div>

        <div class="group group--gap" slot="buttons">
            <button class="button"
                @click="onClose">
                Cancel
            </button>

            <button class="button button--primary"
                @click="update"
                :disabled="controller.loading">
                Update service
            </button>
        </div>

    </modal>
</template>

<script>
export default {

    props: {
        shown: { type: Boolean, required: true },
    },

    computed: {
        viewport() { return this.app.viewports.api; },
        controller() { return this.viewport.services; },
        service() { return this.viewport.selectedService; },
        script() { return this.app.project.script; },
    },

    methods: {
        onClose() {
            this.$emit('close');
        },

        async populateInputFields() {
            this.service.attributes = {
                ...this.service.attributes,
                inputFields: this.controller.getInputFields(),
            };
        },

        async populateInputKeys() {
            this.service.attributes = {
                ...this.service.attributes,
                inputKeys: Array.from(new Set(this.script.collectInputKeys())),
            };
        },

        async populateOutputKeys() {
            this.service.attributes = {
                ...this.service.attributes,
                outputKeys: Array.from(new Set(this.script.collectOutputKeys())),
            };
        },

        async update() {
            await this.controller.updateAttributes(this.service.id, this.service.attributes);
            this.onClose();
        },
    }

};
</script>

<style>
.script-update-service-attributes {

}
</style>
