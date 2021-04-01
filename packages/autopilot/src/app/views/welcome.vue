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

                    <div v-if="currentBubble.title === 'The Play bar'"
                        class="welcome__playback">
                        <div class="playback-item">
                            <span class="playback-item__icon">
                                <i class="fas fa-play"></i>
                            </span>
                            <span class="playback-item__name">Play</span>
                        </div>
                        <div class="playback-item">
                            <span class="playback-item__icon">
                                <i class="fas fa-pause"></i>
                            </span>
                            <span>Pause</span>
                        </div>

                        <div class="playback-item">
                            <span class="playback-item__icon">
                                <i class="fas fa-play"></i>
                                <i class="playback-subicon fas fa-map-marker-alt"></i>
                            </span>
                            <span>Play current Context</span>
                        </div>

                        <div class="playback-item">
                            <span class="playback-item__icon">
                                <i class="fas fa-play"></i>
                                <span class="playback-subicon playback-subicon--text">1</span>
                            </span>

                            <span>Play Action</span>
                        </div>

                        <div class="playback-item">
                            <span class="playback-item__icon">
                                <i class="fas fa-play"></i>
                                <i class="playback-subicon fas fa-circle"></i>
                            </span>

                            <span>Play Action &amp; stop</span>
                        </div>

                        <div class="playback-item">
                            <span class="playback-item__icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </span>
                            <span>Match Context</span>
                        </div>
                        <div class="playback-item">
                            <span class="playback-item__icon">
                                <i class="fas fa-sync-alt"></i>
                            </span>
                            <span>Reset playback</span>
                        </div>
                    </div>

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
    width: 350px;
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

.welcome__playback {
    display: grid;
    grid-template-rows: 1fr 1fr 1fr 1fr;
    grid-template-columns: auto auto;
    grid-auto-flow: column;
    column-gap: var(--gap);
    margin: var(--gap--large) 0;
    font-size: var(--font-size);
}

.playback-item {
    display: grid;
    grid-template-columns: 25px auto;
    justify-content: start;
    align-items: center;
    gap: var(--gap--small);
}

.playback-item__icon {
    display: flex;
    flex-flow: row nowrap;
    align-items: flex-start;
    justify-content: start;
    padding: var(--gap--small) 0;
    box-sizing: border-box;
    border-radius: 0;
    border: 0;
}

.playback-subicon {
    margin-left: 2px;
    font-size: 9px;
}

.playback-subicon--text {
    font-size: 9px;
    font-weight: 600;
}

</style>
