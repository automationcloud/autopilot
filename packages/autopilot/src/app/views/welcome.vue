<template>
    <div v-if="welcome.shown"
        class="welcome">
        <bubble :selector="currentBubble.selector"
            :orientation="currentBubble.orientation"
            :alignment="currentBubble.alignment">
            <div class="welcome__body">
                <div class="welcome__icon">
                    <img src="resources/ubio-robot-black.svg" />
                </div>
                <div class="welcome__close"
                    @click="welcome.hide()">
                    <i class="fas fa-times"></i>
                </div>
                <div class="welcome__content">
                    <div class="welcome__title">
                        {{ currentBubble.title }}
                    </div>
                    <p class="welcome__message"
                        v-if="currentBubble.message"
                        v-text="currentBubble.message.join('\n')">
                    </p>
                    <img v-if="currentBubble.image" :src="currentBubble.image" />
                    <div class="group group--gap--small">
                        <span v-text="`${welcome.currentIndex + 1}/${totalStep}`"></span>
                        <button class="button button--cta welcome__button"
                            @click="welcome.next()"
                            :title="actionTitle">
                            <span>{{ actionTitle }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </bubble>
    </div>
</template>

<script>
export default {
    inject: [
        'welcome',
    ],

    computed: {
        currentBubble() { return this.welcome.getCurrentContent(); },
        totalStep() { return this.welcome.contents.length; },
        actionTitle() { return this.welcome.currentIndex + 1 === this.totalStep ? 'Finish' : 'Next'; },
    },

};
</script>

<style scoped>
.welcome {
    position: fixed;
    z-index: 1000;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    pointer-events: none;
}

.welcome .bubble {
    pointer-events: fill;
}

.welcome >>> .bubble__content {
    width: 300px;
}

.welcome__body {
    display: flex;
    flex-flow: row nowrap;
    color: var(--ui-color--black);
    height: fit-content;

    font-family: var(--font-family--alt);
    font-size: var(--font-size--alt);
}

.welcome__icon {
    flex: 0 0 auto;
    padding: var(--gap--small);
    font-size: 16px;
    line-height: var(--font-size--alt); /* Balances oneliner height */
}

.welcome__title {
    margin: var(--gap--small) 0;
    font-weight: 500;
    font-size: 16px;
}

.welcome__close {
    order: 3;
    padding: var(--gap--small);
    cursor: pointer;
    align-self: flex-start;
}

.welcome__content {
    flex: 1;
}

button.welcome__button {
    color: inherit;
    background: var(--color-yellow--400);
    border: 0;
    font-family: var(--font-family--alt);
}
</style>
