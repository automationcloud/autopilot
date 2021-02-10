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

    inject: [
        'inspect',
    ],

    computed: {
        inspecting() {
            return this.inspect.isInspecting();
        },
        prompt() {
            return this.inspect.prompt || '<span class="section__title"> Select element on the page</span>';
        }
    },

    methods: {
        stopInspect() {
            this.inspect.stopInspect();
        },
    }

};
</script>

<style>
.inspecting {
    position: fixed;
    z-index: 10000;
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
