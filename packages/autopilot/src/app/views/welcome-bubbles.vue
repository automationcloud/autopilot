<template>
    <div v-if="shown"
        class="bubbles" >
        <div class="bubbles__overlay"></div>
        <div class="bubble"
            :class="[
                'bubble-' + current.id,
                `bubble-${current.id}--${platform}`
            ]">

            <div class="bubble__icon">
                <img src="resources/ubio-robot-black.svg" />
            </div>
            <div class="bubble__close"
                @click="welcome.hide()">
                <i class="fas fa-times"></i>
            </div>
            <div class="bubble__body">
                <div class="bubble__title">
                    {{ current.title }}
                </div>
                <p class="bubble__message"
                    v-if="current.message"
                    v-text="current.message.join('\n')">
                </p>
                <img v-if="current.image" :src="current.image" />
                <div class="bubble__actions group group--gap--small">
                    <span v-text="`${currentIndex + 1}/${totalStep}`"></span>
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
        current() { return this.welcome.getCurrentContent(); },
        currentIndex() { return this.welcome.currentIndex; },
        shown() { return this.welcome.welcomeShown() && this.currentIndex >= 0; },
        totalStep() { return this.welcome.contents.length; },
        actionTitle() { return this.currentIndex + 1 === this.totalStep ? 'Finish' : 'Next'; },
        platform() { return os.platform(); },
    },

};
</script>

<style scoped>
.bubbles {
    z-index: 10000;
    top: 0;
    left: 0;
    right: 0;
}

.bubbles__overlay {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,.3);
}

.bubble {
    position: absolute;
    display: flex;
    flex-flow: row nowrap;
    z-index: 100;
    bottom: var(--playback-panel-size);
    color: var(--ui-color--black);
    max-width: 300px;
    height: fit-content;

    border-radius: var(--border-radius);
    background: var(--color-yellow--300);
    box-shadow: 0 1px 3px rgba(0,0,0,.4);

    font-family: var(--font-family--alt);
    font-size: var(--font-size--alt);
    --primary-action-bg: var(--color-yellow--400);
}

.bubble::before {
    content: '';
    background-color: inherit;
    position: absolute;
    width: 1rem;
    height: 1rem;
    transform: rotate(45deg);
    z-index: -1;
}

.bubble-workspace {
    top: 50px;
    left: 100px;
}

.bubble-workspace::before {
    content: '';
    top: -.5rem;
    left: 1rem;
    box-shadow: -2px -2px 3px rgba(0,0,0,.2);
}

.bubble-script-panel {
    top: calc(50%);
    left: calc(50% + .5rem);

}
.bubble-script-panel::before {
    content: '';
    top: 50%;
    left: -.5rem;
    box-shadow: -2px 2px 3px rgba(0,0,0,.2);
}


.bubble-editor-panel {
    top: calc(50%);
    right: calc(50% + .5rem);

}
.bubble-editor-panel::before {
    content: '';
    top: 50%;
    right: -.5rem;
    box-shadow: 2px -2px 3px rgba(0,0,0,.2);
}

.bubble-playback {
    bottom: 60px;
    left: var(--gap);
}
.bubble-playback::before {
    content: '';
    bottom: -.5rem;
    left: 50%;
    box-shadow: 2px 2px 3px rgba(0,0,0,.2);
}

.bubble-login {
    top: 50px;
    right: var(--gap);
}
.bubble-login::before {
    content: '';
    top: -.5rem;
    right: 30px;
    box-shadow: -2px -2px 3px rgba(0,0,0,.2);
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
