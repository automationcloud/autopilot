<template>
    <div class="header">
        <div class="group">
            <span class="badge badge--round badge--red badge--small">
                {{ scriptReport.errors.length }}
            </span>
            <span>errors</span>
        </div>
        <div class="group">
            <span class="badge badge--round badge--yellow badge--small">
                {{ scriptReport.warnings.length }}
            </span>
            <span>warnings</span>
        </div>
        <div class="stretch">
        </div>
        <button class="button button--inverse button--icon frameless"
            @click="scriptReport.runInspections()"
            title="Re-run inspections">
            <i class="fas fa-sync-alt"></i>
        </button>

    </div>
</template>

<script>
import { ScriptReportController } from '~/controllers';

export default {

    computed: {

        scriptReport() {
            return this.get(ScriptReportController);
        }

    },

};
</script>

<style scoped>
.header {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
    color: #fff;
}

.group {
    margin: 0 var(--gap--small);
}

.group .badge {
    margin-right: var(--gap--small);
}
</style>
