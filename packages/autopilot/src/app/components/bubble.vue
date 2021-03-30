<template>
    <div class="bubble"
        :style="style">
        <slot/>
    </div>
</template>

<script>

export default {

    inject: [
        'events',
    ],

    props: {
        selector: { type: String, required: true },
    },

    data() {
        return {
            x: 0,
            y: 0,
        };
    },

    mounted() {
        this.anchorEl = document.querySelector(this.selector);
        this.calcCoordinates();
        window.addEventListener('resize', this.onResize);
        this.events.addListener('layoutResized', this.onResize);
    },

    destroyed() {
        window.removeEventListener('resize', this.onResize);
        this.events.removeListener('layoutResized', this.onResize);
    },

    computed: {

        style() {
            return `left: ${this.x}px; top: ${this.y}px`;
        },

    },

    methods: {

        calcCoordinates() {
            const rect = this.anchorEl.getBoundingClientRect();
            this.x = rect.left;
            this.y = rect.top;
        },

        onResize() {
            this.calcCoordinates();
        },

    }

};
</script>

<style scoped>
.bubble  {
    position: absolute;
    border: 1px solid red;
}
</style>
