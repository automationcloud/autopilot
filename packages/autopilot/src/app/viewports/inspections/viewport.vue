<template>
    <div class="inspections">

        <loader v-if="scriptReport.busy"/>

        <div class="section"
            v-if="!scriptReport.busy">

            <div class="section__subtitle">
                Errors ({{ scriptReport.errors.length }})
            </div>

            <div class="inspections__item"
                v-for="item of scriptReport.errors">
                <inspection-item :item="item"/>
            </div>

            <div class="section__subtitle">
                Warnings ({{ scriptReport.warnings.length }})
            </div>

            <div class="inspections__item"
                v-for="item of scriptReport.warnings">
                <inspection-item :item="item"/>
            </div>

            <div class="section__subtitle">
                Information ({{ scriptReport.infos.length }})
            </div>

            <div class="inspections__item"
                v-for="item of scriptReport.infos">
                <inspection-item :item="item"/>
            </div>
        </div>

    </div>
</template>

<script>
import InspectionItem from './inspection-item.vue';

export default {

    inject: [
        'scriptReport',
    ],

    components: {
        InspectionItem,
    },

    mounted() {
        this.scriptReport.runInspections();
    },

};
</script>

<style>
.inspections {
    padding: 0 var(--gap);
}
</style>
