<template>
    <span class="expand"
            @click="toggle">
        <i class="fa fa-chevron-down"
            v-if="expanded"/>
        <i class="fa fa-chevron-right"
            v-if="!expanded"/>
    </span>
</template>

<script>
export default {
    inject: [
        'expandable',
    ],

    props: {
        id: { type: String },
        stopPropagation: { type: Boolean }
    },

    computed: {

        expanded() {
            return this.expandable.isExpanded(this.id);
        }

    },

    methods: {

        toggle(ev) {
            if (this.stopPropagation) {
                ev.stopPropagation();
            }
            this.expandable.toggleExpand(this.id);
        }

    }

};
</script>

<style scoped>
.expand {
    display: inline-block;
    width: 1.5em;
    text-align: center;
}
</style>
