<template>
    <div class="settings section">

        <setting-entry
            v-for="entry of entries"
            :key="entry.key"
            :entry="entry"/>

    </div>
</template>

<script>
import SettingEntry from './setting-entry.vue';

export default {

    components: {
        SettingEntry,
    },

    computed: {

        viewport() {
            return this.app.viewports.settings;
        },

        entries() {
            return this.viewport.getAllEntries();
        },

    },

};
</script>

<style>
.settings {
    padding: 0 var(--gap);
}
</style>
