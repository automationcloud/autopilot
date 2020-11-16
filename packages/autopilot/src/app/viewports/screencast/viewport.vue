<template>
    <div class="canvas-container"
        :class="'canvas-container--' + screencast.options.size"
        tabindex="0"
        @keydown.stop.prevent="screencast.onKeyDown"
        @keyup.stop.prevent="screencast.onKeyUp">
        <canvas
            ref="canvas"
            class="canvas"
            :width="screencast.clientWidth"
            :height="screencast.clientHeight"
            @mousemove="screencast.onMouseMove"
            @mousedown="screencast.onMouseDown"
            @mouseup="screencast.onMouseUp">
        </canvas>
    </div>
</template>

<script>
export default {

    inject: [
        'screencast',
        'browser',
        'events',
    ],

    data() {
        return {
            ctx: null,
        };
    },

    mounted() {
        this.screencast.startScreencast();
        this.events.addListener('screencastFrameUpdated', this.updateFrame);
        this.ctx = this.$refs.canvas.getContext('2d');
    },

    destroyed() {
        this.screencast.stopScreencast();
        this.events.removeListener('screencastFrameUpdated', this.updateFrame);
    },

    methods: {

        updateFrame(imageData) {
            const img = new Image();
            img.onload = () => {
                const { clientWidth, clientHeight } = this.screencast;
                this.ctx.drawImage(img, 0, 0, clientWidth, clientHeight);
            };
            img.src = `data:image/jpeg;base64,${imageData}`;
        },

    },

};
</script>

<style scoped>
.canvas-container {
    flex: 1;
    position: relative;
    overflow: auto;
}

.canvas-container:focus {
    outline: 4px solid var(--color-blue--500);
    outline-offset: -4px;
}

.canvas-container--fit canvas {
    width: 100%;
}

.canvas {
    cursor: crosshair;
}
</style>
