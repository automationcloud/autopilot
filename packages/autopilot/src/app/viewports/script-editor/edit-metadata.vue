<template>
    <div class="edit-metadata">

        <div class="form-row">
            <label>
                <input type="checkbox"
                    v-model="metadataProxy.draft"
                    :true-value="false"
                    :false-value="true"/>
                    Strict validation
            </label>
        </div>

        <div class="form-row"
            v-if="!metadataProxy.draft">
            <div class="form-row__label">Domain</div>
            <div class="form-row__controls">
                <select class="select stretch"
                    v-model="metadataProxy.domainId">
                    <option v-for="domain of availableDomains"
                        :value="domain.id">
                        {{ domain.id }}
                    </option>
                </select>
            </div>
        </div>

    </div>
</template>

<script>
export default {

    inject: [
        'protocol',
        'project',
    ],

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        metadataProxy() {
            return this.viewport.getMetadataProxy();
        },

        availableDomains() {
            return this.protocol.getAvailableDomains();
        },

    }

};
</script>

<style scoped>
.edit-metadata {
    font-size: var(--font-size--small);
}
</style>
