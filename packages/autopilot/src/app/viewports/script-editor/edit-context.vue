<template>
    <div class="edit-context section">

        <div class="form-row">
            <div class="form-row__label">
                Context name
            </div>
            <div class="form-row__controls">
                <input type="text"
                       class="input input--block"
                       v-model="contextProxy.name"
                       :disabled="context.type !== 'context'"/>
            </div>
        </div>

        <template v-if="context.type === 'context'">
            <div class="form-row">
                 <div class="form-row__label">
                    Flow
                 </div>
                 <div class="form-row__controls">
                    <select v-model="contextProxy.flowType"
                            class="input">
                        <option value="normal"
                                label="normal">
                        </option>
                        <option value="success"
                                label="success">
                        </option>
                        <option value="fail"
                                label="fail">
                        </option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-row__label">
                    Matching mode
                </div>
                <div class="form-row__controls">
                    <select v-model="contextProxy.matchMode"
                            class="input">
                        <option value="fast"
                                label="fast">
                        </option>
                        <option value="slow"
                                label="slow">
                        </option>
                    </select>
                </div>
            </div>

            <div class="form-row"
                 v-if="context.flowType !== 'success'">
                 <div class="form-row__label">
                     Error code
                 </div>
                 <div class="form-row__controls">
                    <error-code v-model="contextProxy.errorCode"/>
                </div>
            </div>

            <div class="form-row">
                <div class="form-row__label">
                    Visits limit
                </div>
                <div class="form-row__controls">
                    <input type="number"
                           max="999"
                           size="3"
                           class="input"
                           v-model.number="contextProxy.limit"/>
                </div>
            </div>

            <div class="form-row">
                <div class="form-row__label">
                    Resolve 3dsecure
                </div>
                <div class="form-row__controls">
                    <input type="checkbox"
                        class="input"
                        v-model="contextProxy.resolve3dsecure"/>
                </div>
            </div>
        </template>

    </div>
</template>

<script>
import ErrorCode from './tools/error-code.vue';

export default {

    components: {
        ErrorCode,
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        context() {
            return this.viewport.getSelectedContext();
        },

        contextProxy() {
            return this.viewport.createContextProxy(this.context);
        }

    }

};
</script>

<style>
.edit-context {
    padding: 0 var(--gap--small);
}
</style>
