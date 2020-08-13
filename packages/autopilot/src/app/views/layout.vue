<template>
    <div class="layout">
        <layout-item
            :layout-item="root"/>
    </div>
</template>

<script>
import LayoutItem from './layout-item.vue';

export default {

    components: {
        LayoutItem
    },

    computed: {

        root() {
            return this.app.layout.root;
        },

    }

};
</script>

<style>
.layout {
    flex: 1;
    display: flex;
    overflow-y: hidden;
}
</style>
