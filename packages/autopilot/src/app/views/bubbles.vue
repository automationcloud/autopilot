<template>
    <transition name="fade" mode="out-in">
        <div class="bubbles"
            v-if="currentBubble"
            @keydown.esc="bubbles.removeAll()">
            <bubble :selector="currentBubble.selector"
                :orientation="currentBubble.orientation"
                :alignment="currentBubble.alignment"
                @hide="bubbles.removeAll()">
                <div class="bubble__content">
                    <component :is="'bubble-' + currentBubble.id" />
                    <div class="group group--gap--small">
                        <b v-text="`${currentStep}/${totalStep}`"></b>
                        <button class="button button--cta bubbles__button"
                            @click="bubbles.remove(currentBubble.id)"
                            :title="actionTitle">
                            <span>{{ actionTitle }}</span>
                        </button>
                    </div>
                </div>
            </bubble>
        </div>
    </transition>
</template>

<script>
// https://webpack.js.org/guides/dependency-management/#requirecontext
const ctx = require.context('../bubbles', true, /\.vue$/);
const bubbleComponents = {};
for (const key of ctx.keys()) {
    const name = 'bubble-' + key.replace(/\.vue$/, '').replace(/[^a-z0-9_-]/gi, '');
    const component = ctx(key).default;
    bubbleComponents[name] = component;
}

export default {

    inject: [
        'bubbles',
    ],

    components: {
        ...bubbleComponents
    },

    computed: {
        currentBubble() { return this.bubbles.currentBubble; },
        totalStep() { return this.bubbles.countForSession; },
        currentStep() { return this.totalStep - this.bubbles.queue.length + 1; },
        actionTitle() { return this.currentStep === this.totalStep ? 'Finish' : 'Next'; },
    }
};
</script>

<style scoped>
.bubbles {
    position: fixed;
    z-index: 1000;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    pointer-events: none;
}

.bubbles .bubble {
    pointer-events: fill;
}

button.bubbles__button {
    color: inherit;
    background: var(--color-yellow--400);
    border: 0;
    font-family: var(--font-family--alt);
}

</style>
