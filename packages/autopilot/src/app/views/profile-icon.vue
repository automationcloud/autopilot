<template>
    <div v-if="profileCount > 1">
        <span class="profile-icon"
            :aria-label="serviceName">
            <i class="fas fa-window-maximize"></i>
            <b>{{ profileShortName }}</b>
        </span>
    </div>
</template>

<script>
export default {

    computed: {

        profileShortName() {
            const name = this.app.storage.profileName || 'Default';
            return name.includes('Profile') ? name.replace('Profile', '').trim() : 'D';
        },

        serviceName() {
            return this.app.project.automation.metadata.serviceName || 'New Automation';
        },

        profileCount() {
            return this.app.storage.profileCount;
        },

    },

};
</script>

<style>

.profile-icon {
    color: var(--color-yellow--500);
    display: inline-grid;
    grid-auto-flow: column;
    align-items: center;
    grid-column-gap: 5px;
}

.profile-icon:hover {
    position: relative;
}

.profile-icon:hover::after {
  content: attr(aria-label);
  padding: 4px 8px;
  margin-top: 20px;
  position: absolute;
  z-index: 10;
  right: -1.5em; /* workaround as can not align to the middle */
  top: 100%;
  white-space: nowrap;
  background: var(--color-yellow--200);
  color: var(--ui-color--black);
}

</style>
