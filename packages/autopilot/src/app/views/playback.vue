<template>
    <div class="playback">
        <div class="playback__error"
             v-if="error">
             <error :err="error"
                :allow-dismiss="true"
                :show-error-code="true"
                @dismiss="dismissError"/>
        </div>
        <div class="playback__toolbar">
            <div class="playback__group playback__buttons">

                <button class="playback__btn"
                        :disabled="!isCanPlayScript"
                        @click="playScript"
                        title="Play script from selected item">
                    <i class="playback__icon fas fa-play"></i>
                </button>
                <button class="playback__btn"
                        :disabled="isPaused"
                        @click="pause">
                    <i class="playback__icon fas fa-pause"></i>
                </button>

                <button class="playback__btn playback__btn--context"
                        :disabled="!isCanPlayContext"
                        @click="playContext"
                        title="Play context">
                    <i class="playback__icon fas fa-play"></i>
                    <i class="playback__subicon fas fa-map-marker-alt"></i>
                </button>

                <button class="playback__btn playback__btn--play-action"
                        :disabled="!isCanPlayAction"
                        @click="playAction(true)"
                        title="Play action">
                    <i class="playback__icon fas fa-play"></i>
                    <span class="playback__subicon playback__subicon--text">1</span>
                </button>

                <button class="playback__btn playback__btn--debug-action"
                        :disabled="!isCanPlayAction"
                        @click="playAction(false)"
                        title="Debug action">
                    <i class="playback__icon fas fa-play"></i>
                    <i class="playback__subicon fas fa-circle"></i>
                </button>

                <button class="playback__btn playback__btn--context"
                        :disabled="!isCanMatchContexts"
                        @click="matchContexts">
                    <i class="playback__icon fas fa-map-marker-alt"></i>
                </button>
            </div>

            <div class="playback__group">
                <div class="playback__badges group group--gap--small">
                    <span class="badge badge--yellow--light badge--small"
                        v-if="throttlingMode === '2g'">
                        2G
                    </span>
                    <span class="badge badge--yellow--light badge--small"
                        v-if="throttlingMode === '3g'">
                        3G
                    </span>
                    <div class="playback__timer badge"
                        @dblclick="resetTimer">
                        <span class="playback__timer-mins">{{ timer.mins }}</span>
                        <span class="playback__timer-secs">{{ timer.secs }}</span>
                        <span class="playback__timer-millis">{{ timer.millis }}</span>
                    </div>
                </div>
                <button class="playback__btn"
                        :disabled="isRunning"
                        @click="reset">
                    <i class="playback__icon fas fa-sync-alt">
                    </i>
                </button>
                <playback-status/>
            </div>
        </div>
    </div>
</template>

<script>
import PlaybackStatus from './playback-status.vue';
import { EmulationController } from '~/controllers';

export default {

    inject: [
        'playback',
    ],

    components: {
        PlaybackStatus
    },

    computed: {
        throttlingMode() { return this.get(EmulationController).throttlingMode; },
        script() { return this.app.project.script; },
        isPaused() { return this.playback.isPaused(); },
        isRunning() { return this.playback.isRunning(); },
        isCanPlayScript() { return this.playback.isCanPlayScript(); },
        isCanPlayContext() { return this.playback.isCanPlayContext(); },
        isCanPlayAction() { return this.playback.isCanPlayAction(); },
        isCanMatchContexts() { return this.playback.isCanMatchContexts(); },
        timer() { return this.playback.getTimer(); },
        error() { return this.script.$playback.error; }
    },

    methods: {
        pause() {
            this.playback.pause();
        },

        playScript() {
            this.playback.playScript();
        },

        playContext() {
            this.playback.playContext();
        },

        playAction(advance) {
            this.playback.playAction(advance);
        },

        matchContexts() {
            this.playback.matchContexts();
        },

        reset() {
            this.playback.reset();
        },

        resetTimer() {
            this.playback.resetTimer();
        },

        dismissError() {
            this.script.$playback.status = 'idle';
            this.script.$playback.error = null;
        }

    }

};
</script>

<style>
.playback {
    position: relative;
    z-index: 10;
}

.playback__toolbar {
    display: flex;
    justify-content: space-between;
    background: var(--color-mono--800);
}

.playback__group {
    display: flex;
    align-items: center;
}

.playback__buttons {
    margin-left: var(--gap);
}

button.playback__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--gap);
    box-sizing: border-box;
    border-radius: 0;
    height: 100%;

    border: 0;
    background: transparent;
    color: #fff;
    font-size: 16px;
}

button.playback__btn:hover {
    box-shadow: 0 0 0 9999px rgba(255,255,255,.05) inset;
}

button.playback__btn--play-action {
    color: var(--color-brand-blue--500);
}

button.playback__btn--debug-action {
    color: var(--color-green--500);
}

button.playback__btn--context {
    color: var(--color-yellow--500);
}

button.playback__btn[disabled] {
    color: var(--color-mono--500);
}

.playback__timer {
    box-sizing: border-box;
    cursor: default;
    user-select: none;
    display: flex;
    align-items: flex-start;

    font-family: var(--font-family--mono);
    font-size: 11px;

    background: var(--color-mono--700);
    color: #fff;
}

.playback__timer-secs::before {
    content: ':';
}

.playback__timer-millis {
    padding-left: 2px;
    line-height: 12px;
    font-size: 6px;
}

.playback__icon {
    text-align: center;
}

.playback__subicon {
    margin-left: 2px;
    font-size: 9px;
}

.playback__subicon--text {
    font-size: 11px;
    font-weight: 600;
}

.playback__error {
    border-top: 1px solid var(--color-red--300);
}

.playback__badges {
    align-self: center;
}
</style>
