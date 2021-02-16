<template>
    <div class="notifications">
        <transition-group name="fade-shove">
            <notification v-for="n in notifications.current"
                :key="n.id"
                :notification="n"/>
        </transition-group>
    </div>
</template>

<script>
export default {

    inject: [
        'notifications',
    ],

};
</script>

<style scoped>
.notifications {
    position: fixed;
    z-index: 5000;
    bottom: var(--playback-panel-size);
    left: 0;
    right: 0;
    padding: var(--gap);
}
</style>
