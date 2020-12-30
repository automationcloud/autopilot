<template>
    <div class="modal">
        <div class="modal__header">
            <span>Edit bundle</span>
        </div>
        <div class="modal__body">
            <div class="form-row">
                <div class="form-row__label">Name</div>
                <div class="form-row__controls">
                    <input class="input stretch"
                        v-model="bundleProxy.name"/>
                </div>
            </div>
            <div class="form-row">
                <div class="form-row__label">Private</div>
                <div class="form-row__controls">
                    <input type="checkbox"
                        v-model="bundleProxy.excluded"/>
                </div>
            </div>
            <div class="modal__buttons">
                <button class="button button--primary"
                    @click="editing = false">
                    Done
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {

    inject: [
        'bundles'
    ],

    computed: {
        bundleProxy() {
            return this.bundles.createCurrentBundleProxy();
        },
    },

};
</script>
