<template>
    <div v-if="welcome.shown"
        class="bubble"
        :style="style">
        <div class="bubble-arrow"
            :class="[
                'bubble-arrow--' + currentBubble.arrow
            ]">
        </div>
        <div class="bubble-main"
            :style="currentBubble.bodyStyle">
            <div class="bubble__icon">
                <img src="resources/ubio-robot-black.svg" />
            </div>
            <div class="bubble__close"
                @click="welcome.hide()">
                <i class="fas fa-times"></i>
            </div>
            <div class="bubble__body">
                <div class="bubble__title">
                    {{ currentBubble.title }}
                </div>
                <p class="bubble__message"
                    v-if="currentBubble.message"
                    v-text="currentBubble.message.join('\n')">
                </p>
                <img v-if="currentBubble.image" :src="currentBubble.image" />
                <div class="bubble__actions group group--gap--small">
                    <span v-text="`${welcome.currentIndex + 1}/${totalStep}`"></span>
                    <button class="button button--cta bubble__button"
                        @click="welcome.next()"
                        :title="actionTitle">
                        <span>{{ actionTitle }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import os from 'os';

export default {

    inject: [
        'welcome',
    ],

    computed: {
        currentBubble() { return this.welcome.getCurrentContent(); },
        totalStep() { return this.welcome.contents.length; },
        actionTitle() { return this.currentIndex + 1 === this.totalStep ? 'Finish' : 'Next'; },
        platform() { return os.platform(); },
        style() { return this.welcome.currentStyle; },
    },

    mounted() {
        this.welcome.setCurrentStyle();
        window.addEventListener('resize', this.welcome.setCurrentStyle());
    },

    destroyed() {
        window.removeEventListener('resize', this.welcome.setCurrentStyle());
    },

    methods: {
    }

};
</script>

<style scoped>
.bubble {
    position: absolute;
    z-index: 10000;
    display: flex;
    --primary-color: var(--color-yellow--300);
}

.bubble-main {
    display: flex;
    flex-flow: row nowrap;
    z-index: 100;
    bottom: var(--playback-panel-size);
    color: var(--ui-color--black);
    max-width: 300px;
    height: fit-content;

    border-radius: var(--border-radius);
    box-shadow: 0 2px 3px rgba(0,0,0,.4);
    background: var(--primary-color);

    font-family: var(--font-family--alt);
    font-size: var(--font-size--alt);
    --primary-action-bg: var(--color-yellow--400);
}

.bubble-arrow {
    border: 10px solid var(--primary-color);
    width: 0;
    height: 0;
}

.bubble-arrow--up {
    border-top: 0px;
    border-left-color: transparent;
    border-right-color: transparent;
}

.bubble-arrow--down {
    border-bottom: 0px;
    border-left-color: transparent;
    border-right-color: transparent;
}

.bubble-script-panel {
    top: calc(50%);
    left: calc(50% + .5rem);

}
.arrow--left::before {
    content: '';
    left: -.5rem;
    box-shadow: -2px 2px 3px rgba(0,0,0,.2);
}

.arrow--right::before {
    content: '';
    right: -.5rem;
    box-shadow: 2px -2px 3px rgba(0,0,0,.2);
}

.arrow--down::before {
    content: '';
    bottom: -.5rem;
    box-shadow: 2px 2px 3px rgba(0,0,0,.2);
}

.bubble-editor-panel {
    top: calc(50%);
    right: calc(50% + .5rem);

}

.bubble-playback {
    bottom: 60px;
    left: var(--gap);
}

.bubble-login {
    top: 50px;
    right: var(--gap);
}


.bubble-login--win32 {
    right: calc(var(--gap) + 80px);
}
.bubble-login--win32::before {
    content: '';
    right: 110px
}

.bubble-play-script {
    bottom: 60px;
    left: var(--gap);
}
.bubble-play-script::before {
    content: '';
    bottom: -.5rem;
    left: .5rem;
    box-shadow: 2px 2px 3px rgba(0,0,0,.2);
}

.bubble__icon {
    flex: 0 0 auto;
    padding: var(--gap) var(--gap--small);
    font-size: 16px;
    line-height: var(--font-size--alt); /* Balances oneliner height */
}

.bubble__close {
    order: 3;
    padding: var(--gap);
    cursor: pointer;
    align-self: flex-start;
}

.bubble__body {
    flex: 1;
}

.bubble__title {
    margin: var(--gap) 0;
}

.bubble__message {
    margin: var(--gap) 0;
    font-size: .85em;
    line-height: 1.25;
    /* font-weight: 300; */
    opacity: .8;
    white-space: pre-wrap;
}

.bubble__actions {
    margin: var(--gap) 0;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
}

button.bubble__button {
    color: inherit;
    background: var(--primary-action-bg);
    border: 0;
    font-family: var(--font-family--alt);
}

</style>
