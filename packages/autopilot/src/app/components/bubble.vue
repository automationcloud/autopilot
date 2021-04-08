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
        <div class="bubble__body">
            <div class="bubble__icon">
                <img src="resources/ubio-robot-black.svg" />
            </div>
            <div v-if="closable"
                class="bubble__close"
                @click="$emit('hide')">
                <i class="fas fa-times"></i>
            </div>
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
        closable: { type: Boolean, default: false },
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

        /*
        calcBodySize() {
            if (!this.anchorEl) {
                return;
            }


            const elem = document.querySelector('.bubble__body');
            const bounding = elem.getBoundingClientRect();
            const vw = window.innerWidth || document.documentElement.clientWidth;
            if (bounding.left < 0) {
                // Left side is out of viewoprt
                this.width = 350 + bounding.left;
            }

            if (bounding.right > vw) {
                this.width = 350 - (bounding.right - vw);
            }
        },
        */

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
