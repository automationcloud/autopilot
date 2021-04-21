<template>
    <div class="inspect"
        v-if="inspect.isInspecting()">

        <article class="inspect__content">
            <h3>{{ prompt }} </h3>

            <div class="inspect__controls">
                <button class="button"
                    @click="inspect.stopInspect()">
                    Cancel
                </button>
            </div>
        </article>

    </div>
</template>

<script>
export default {

    inject: [
        'inspect'
    ],

    computed: {

        prompt() {
            return this.inspect.options.prompt || 'Select an element on the page';
        }

    }

};
</script>

<style scoped>
.inspect {
    z-index: 20000;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    background: rgba(255, 255, 255, .85);
}

.inspect__content {
    text-align: center;
}

.inspect__controls {
    padding-top: var(--gap);
}
</style>
