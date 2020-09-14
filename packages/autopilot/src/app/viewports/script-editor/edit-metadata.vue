<template>
    <div class="edit-metadata">

        <div class="form-row">
            <div class="form-row__label">Domain</div>
            <div class="form-row__controls">
                <select class="input"
                    v-model="metadataProxy.domainId">
                    <option v-for="domain of availableDomains"
                        :value="domain.id">
                        {{ domain.id }}
                    </option>
                </select>
            </div>
        </div>

        <div class="form-row">
            <div class="form-row__label">Strict validation</div>
            <div class="form-row__controls">
                <input type="checkbox"
                    v-model="metadataProxy.draft"
                    :true-value="false"
                    :false-value="true"/>
            </div>
        </div>

        <!-- <explore :data="{ executionErrors }"/> -->

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

        metadata() {
            return this.project.metadata;
        },

        metadataProxy() {
            return this.viewport.getMetadataProxy();
        },

        availableDomains() {
            return this.protocol.getAvailableDomains();
        },

        executionErrors() {
            return this.protocol.executionErrors.map(er => er.code);
        }

    }

};
</script>

<style>
</style>
