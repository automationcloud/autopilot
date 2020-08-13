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

    props: {
        id: { type: String },
        stopPropagation: { type: Boolean }
    },

    computed: {

        expanded() {
            return this.app.ui.expandable.isExpanded(this.id);
        }

    },

    methods: {

        toggle(ev) {
            if (this.stopPropagation) {
                ev.stopPropagation();
            }
            this.app.ui.expandable.toggleExpand(this.id);
        }

    }

};
</script>
