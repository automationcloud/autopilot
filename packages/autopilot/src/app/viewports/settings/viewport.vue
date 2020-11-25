<template>
    <div class="settings section">
        <preferences/>
    </div>
</template>

<script>
import Preferences from './preferences.vue';

export default {

    components: {
        Preferences,
    },

};
</script>

<style scoped>
.settings {
    padding: 0 var(--gap);
    background: var(--color-cool--100) !important;
}
</style>
