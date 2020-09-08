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
import { ExpandableController } from '~/controllers';

export default {

    props: {
        id: { type: String },
        stopPropagation: { type: Boolean }
    },

    computed: {

        ctl() {
            return this.get(ExpandableController);
        },

        expanded() {
            return this.ctl.isExpanded(this.id);
        }

    },

    methods: {

        toggle(ev) {
            if (this.stopPropagation) {
                ev.stopPropagation();
            }
            this.ctl.toggleExpand(this.id);
        }

    }

};
</script>

<style scoped>
.expand {
    display: inline-block;
    width: 28px;
    text-align: center;
}
</style>
