<template>
    <div class="speed section">
        <table class="table">
            <tr class="table__row table__head">
                <th class="table__cell"></th>
                <th class="table__cell"></th>
                <th class="table__cell"></th>
            </tr>
            <tr class="table__row">
                <td class="table__cell speed__stat-icon">
                    <i class="fa fas fa-map-marker-alt color--yellow"></i>
                </td>
                <td class="table__cell stat__label">
                    Context matching
                </td>
                <td class="table__cell stat__samples">
                    {{ duration(stats.contextMatchTime.sum) }}
                </td>
            </tr>
            <tr class="table__row">
                <td class="table__cell speed__stat-icon">
                    <i class="fa fa-mouse-pointer"></i>
                </td>
                <td class="table__cell stat__label">
                    Clicks
                </td>
                <td class="table__cell stat__samples">
                    {{ duration(stats.actionPerTypeTime.click.sum) }}
                </td>
            </tr>
            <tr class="table__row">
                <td class="table__cell speed__stat-icon">
                    <i class="fa fa-i-cursor"></i>
                </td>
                <td class="table__cell stat__label">
                    Inputs
                </td>
                <td class="table__cell stat__samples">
                    {{ duration(stats.actionPerTypeTime.input.sum) }}
                </td>
            </tr>
            <tr class="table__row">
                <td class="table__cell speed__stat-icon">
                    <i class="fa fa-hourglass"></i>
                </td>
                <td class="table__cell stat__label">
                    Sleeps
                </td>
                <td class="table__cell stat__samples">
                    {{ duration(stats.actionPerTypeTime.sleep.sum) }}
                </td>
            </tr>
        </table>

    </div>
</template>

<script>
export default {

    computed: {

        script() {
            return this.app.project.script;
        },

        stats() {
            return this.app.stats;
        },

    },

    methods: {

        duration(dur) {
            return dur > 1000 ? (Math.round(dur / 100000) * 100).toFixed(2) + 's' : dur + 'ms';
        }

    }

};
</script>

<style>
.speed__stat-icon {
    width: 32px;
    text-align: center;
}
</style>
