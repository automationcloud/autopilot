<template>
    <modal class="script-new section"
        content-class="modal__content--wide"
        :shown="shown"
        @close="onClose">

        <div class="section__title">
            New script
        </div>

        <div class="box box--yellow box--small"
            v-if="namesMismatch">
           <strong>Warning!</strong>
           Service name <strong>{{ service.name }}</strong> does not match
           script name <strong>{{ script.name }}</strong>.
           Proceed at your own risk.
       </div>

       <div class="form-row">
           <div class="form-row__label">
               Version
           </div>
           <div class="form-row__controls group group--gap">
                <select class="input"
                    v-model="version">
                    <option value="patch" label="patch"></option>
                    <option value="minor" label="minor"></option>
                    <option value="major" label="major"></option>
                    <option value="custom" label="custom"></option>
                </select>
                <input class="input"
                    v-model="customVersion"
                    v-if="version === 'custom'"/>
           </div>
       </div>

       <div class="form-row">
            <div class="form-row__label">
                Worker tag
            </div>
            <div class="form-row__controls group group--gap">
                <input class="input"
                    v-model="workerTag"/>
            </div>
        </div>

       <div class="form-block">
            <div class="form-block__label">
                Note
            </div>
            <div class="form-block__controls">
                <textarea v-model="note" rows="6" placeholder="Describe your changes"></textarea>
            </div>
        </div>

       <div class="group group--gap" slot="buttons">
            <button class="button"
                @click="onClose">
                Cancel
            </button>
            <button class="button button--primary"
                @click="create"
                :disabled="controller.loading">
                Create script v.{{ fullVersion }}
            </button>
        </div>

    </modal>
</template>

<script>
import semver from 'semver';

export default {

    props: {
        shown: { type: Boolean, required: true },
    },

    data() {
        return {
            version: 'patch',
            customVersion: '',
            workerTag: 'stable',
            note: '',
        };
    },

    mounted() {
        this.customVersion = this.getLastVersion();
    },

    computed: {
        viewport() { return this.app.viewports.api; },
        controller() { return this.viewport.scripts; },
        script() { return this.app.project.script; },
        service() { return this.viewport.selectedService; },

        namesMismatch() {
            return this.script.name !== this.service.name;
        },

        fullVersion() {
            if (this.version === 'custom') {
                return this.customVersion;
            }
            return semver.inc(this.getLastVersion(), this.version);
        },

    },

    methods: {
        onClose() { this.$emit('close'); },

        getLastVersion() {
            const [script] = this.controller.scripts;
            if (script) {
                return script.fullVersion;
            }
            return '0.0.0';
        },

        async create() {
            await this.controller.createNewScript({
                fullVersion: this.version === 'custom' ? this.customVersion : this.version,
                workerTag: this.workerTag,
                note: this.note,
            });
            this.onClose();
        },
    }

};
</script>

<style>
.script-new {

}
</style>
