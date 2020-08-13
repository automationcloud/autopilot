<template>
    <div class="inspection-item"
        :class="[
            'inspection-item--' + item.level,
        ]">
        <div class="icon">
            <i :class="iconClass"/>
        </div>
        <div class="body">
            <div class="title">{{ item.message }}</div>
            <div class="location">
                <link-context v-if="item.context"
                    :context="item.context"/>
                <link-action v-if="item.action"
                    :action="item.action"
                    style="margin-left: var(--gap--small)"/>
            </div>
            <div class="details"
                v-if="item.details">
                <explore
                    :data="item.details"
                    :options="{ types: false, indexBase: 1 }"/>
            </div>
        </div>
    </div>
</template>

<script>
export default {

    props: ['item'],

    computed: {

        iconClass() {
            switch (this.item.level) {
                case 'error':
                    return 'fas fa-exclamation-circle';
                case 'warn':
                    return 'fas fa-exclamation-triangle';
                case 'info':
                    return 'fas fa-info-circle';
                default:
                    return '';
            }
        }

    },

    methods: {

        goTo(node) {
            this.app.viewports.scriptFlow.activateViewport();
            this.app.viewports.scriptFlow.selectItem(node);
            this.app.viewports.scriptFlow.revealSelected();
        },

    }

};
</script>

<style scoped>
.inspection-item {
    display: flex;
    margin: var(--gap) 0;
    align-items: center;
}

.icon {
    flex: 0 0 32px;
    text-align: center;
    font-size: 20px;
}

.inspection-item--error .icon {
    color: var(--color-red--500);
}

.inspection-item--warn .icon {
    color: var(--color-yellow--500);
}

.inspection-item--info .icon {
    color: var(--color-blue--500);
}

.title {
    font-weight: 600;
    padding-bottom: var(--gap--small);
}

.location {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
}
</style>
