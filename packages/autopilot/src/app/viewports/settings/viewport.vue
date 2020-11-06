<template>
    <div class="settings section">

        <preferences/>

        <!--
        <setting-entry
            v-for="entry of entries"
            :key="entry.key"
            :entry="entry"/>
        -->

    </div>
</template>

<script>
import SettingEntry from './setting-entry.vue';
import Preferences from './preferences.vue';

export default {

    components: {
        SettingEntry,
        Preferences,
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

<style scoped>
.settings {
    padding: 0 var(--gap);
    background: var(--color-cool--100) !important;
}
</style>
