<template>
    <div class="inspecting section"
        v-if="inspecting"
        @click="stopInspect">
        <div v-html="prompt"></div>
        <p>Click here to cancel</p>
    </div>
</template>

<script>
export default {

    computed: {
        inspecting() {
            return this.app.inspector.isInspecting();
        },
        prompt() {
            return this.app.inspector.prompt || '<span class="section__title"> Select element on the page</span>';
        }
    },

    methods: {
        stopInspect() {
            this.app.inspector.stopInspect();
        },
    }

};
</script>

<style>
.inspecting {
    position: fixed;
    z-index: 1000000;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,.75);

    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
}
</style>
