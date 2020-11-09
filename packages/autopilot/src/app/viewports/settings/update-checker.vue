<template>
    <div class="update-checker">
        <i class="fas fa-spinner fa-spin"
            v-if="!updater.isReady">
        </i>
        <template v-else>
            <span class="up-to-date"
                v-if="updater.isUpToDate">
                Up to date
                <i class="fas fa-check-circle" style="margin-left: 4px"></i>
            </span>
            <template v-else>
                <button class="button button--primary"
                    @click="updater.installUpdates()">
                    Update to {{ updater.upstreamVersion}}
                </button>
            </template>
        </template>
    </div>
</template>

<script>
export default {

    inject: [
        'updater'
    ]

};
</script>

<style scoped>
.up-to-date {
    color: var(--color-green--500);
}
</style>
