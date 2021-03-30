<template>
    <div v-if="anchorExists"
        class="bubble"
        :class="[
            'bubble--' + orientation,
            'bubble--' + alignment,
        ]"
        :style="style">
        <div class="bubble__arrow">
        </div>
        <div class="bubble__content">
            <slot/>
        </div>
    </div>
</template>

<script>

export default {

    inject: [
        'events',
    ],

    props: {
        selector: { type: String, required: true },
        orientation: { type: String, required: true },
        alignment: { type: String, required: true },
    },

    data() {
        return {
            anchorExists: false,
            x: 0,
            y: 0,
        };
    },

    mounted() {
        this.refreshAnchor();
        this.calcCoordinates();
        window.addEventListener('resize', this.onResize);
        this.events.addListener('layoutResized', this.onResize);
        this.events.addListener('layoutUpdated', this.onLayoutUpdate);
    },

    destroyed() {
        window.removeEventListener('resize', this.onResize);
        this.events.removeListener('layoutResized', this.onResize);
        this.events.removeListener('layoutUpdated', this.onLayoutUpdate);
    },

    computed: {

        style() {
            return `transform: translate(${this.x}px, ${this.y}px)`;
        },

    },

    watch: {
        selector() {
            this.refreshAnchor();
            this.calcCoordinates();
        }
    },

    methods: {

        refreshAnchor() {
            if (this.anchorEl && !this.anchorEl.isConnected) {
                this.anchorEl = null;
            }
            this.anchorEl = document.querySelector(this.selector);
            this.anchorExists = !!this.anchorEl;
        },

        calcCoordinates() {
            if (!this.anchorEl) {
                return;
            }
            const rect = this.anchorEl.getBoundingClientRect();
            this.x = rect.left;
            this.y = rect.top;
        },

        onResize() {
            this.refreshAnchor();
            this.calcCoordinates();
        },

        onLayoutUpdate() {
            this.$nextTick(() => {
                this.refreshAnchor();
                this.calcCoordinates();
            });
        },

    }

};
</script>

<style scoped>
.bubble {
    --arrow-size: 12px;
    position: absolute;
    filter: drop-shadow(0 1px 3px rgba(0,0,0,.25));
}

.bubble__content {
    position: absolute;
    padding: var(--gap);
    min-width: 240px;
    min-height: 64px;
    border-radius: var(--border-radius);
    background: var(--color-yellow--300);
}

.bubble__arrow {
    position: absolute;
    z-index: 5;
    width: 0;
    height: 0;
    border: var(--arrow-size) solid transparent;
    transform: translate(-50%, -50%);
}

.bubble--top .bubble__content {
    margin-top: var(--arrow-size);
    top: 0;
}
.bubble--bottom .bubble__content {
    margin-bottom: var(--arrow-size);
    bottom: 0;
}
.bubble--right .bubble__content {
    margin-right: var(--arrow-size);
    right: 0;
}
.bubble--left .bubble__content {
    margin-left: var(--arrow-size);
    left: 0;
}

.bubble--top.bubble--start .bubble__content,
.bubble--bottom.bubble--start .bubble__content { transform: translateX(-10%) }

.bubble--top.bubble--middle .bubble__content,
.bubble--bottom.bubble--middle .bubble__content { transform: translateX(-50%) }

.bubble--top.bubble--end .bubble__content,
.bubble--bottom.bubble--end .bubble__content { transform: translateX(-90%) }

.bubble--left.bubble--start .bubble__content,
.bubble--right.bubble--start .bubble__content { transform: translateY(-25%) }

.bubble--left.bubble--middle .bubble__content,
.bubble--right.bubble--middle .bubble__content { transform: translateY(-50%) }

.bubble--left.bubble--end .bubble__content,
.bubble--right.bubble--end .bubble__content { transform: translateY(-75%) }

.bubble--top .bubble__arrow { border-bottom-color: var(--color-yellow--300) }
.bubble--bottom .bubble__arrow { border-top-color: var(--color-yellow--300) }
.bubble--left .bubble__arrow { border-right-color: var(--color-yellow--300) }
.bubble--right .bubble__arrow { border-left-color: var(--color-yellow--300) }

</style>
