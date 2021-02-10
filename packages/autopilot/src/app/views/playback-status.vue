<template>
    <div class="playback-status"
         :class="'playback-status--' + status"
         @click="jumpTo">
        <i class="playback-status__icon far fa-circle"
           v-if="status === 'idle'"
           title="Ready">
        </i>
        <i class="playback-status__icon fas fa-ellipsis-h"
           v-if="status === 'running'"
           title="Running...">
        </i>
        <i class="playback-status__icon fas fa-ellipsis-h"
           v-if="status === 'matching'"
           title="Matching context...">
        </i>
        <i class="playback-status__icon fas fa-check-circle"
           v-if="status === 'success'"
           title="Success">
        </i>
        <i class="playback-status__icon fas fa-exclamation-circle"
           v-if="status === 'error'"
           title="Error">
        </i>
    </div>
</template>

<script>
export default {

    inject: [
        'playback',
        'project',
    ],

    computed: {
        script() { return this.project.script; },
        status() { return this.script.$playback.status; }
    },

    methods: {

        jumpTo() {
            this.playback.jumpToPlayhead();
        },

    }

};
</script>

<style>
.playback-status {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--playback-panel-size);
    height: var(--playback-panel-size);
    cursor: pointer;

    font-size: 18px;
}

.playback-status__icon {
    width: 1.5em;
    text-align: center;
}

.playback-status--idle {
    background: var(--color-mono--600);
    color: #fff;
}

.playback-status--running {
    background: var(--color-blue--500);
    color: #fff;
}

.playback-status--matching {
    background: var(--color-yellow--500);
    color: #fff;
}

.playback-status--success {
    background: var(--color-green--500);
    color: #fff;
}

.playback-status--error {
    background: var(--color-red--500);
    color: #fff;
}
</style>
