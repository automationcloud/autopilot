<template>
    <div class="inspections-header group group--gap--small stretch">

        <div class="inspections-header__item group group--gap--small">
            <span class="badge badge--round badge--red badge--small">
                {{ scriptReport.errors.length }}
            </span>
            <span>errors</span>
        </div>
        <div class="inspections-header__item group group--gap--small">
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

<style>
.inspections-header__item {
    color: var(--ui-color--white);
}
</style>
