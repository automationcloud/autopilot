<template>
    <div class="header">
        <div class="breadcrumbs">
            <a class="link"
                @click="viewport.goToServices()">
                Services
            </a>
            <a class="link"
                @click="viewport.selectService(service)"
                v-if="service">
                {{ service.name }}
            </a>
        </div>
    </div>
</template>

<script>
export default {

    computed: {
        viewport() { return this.app.viewports.api; },
        service() { return this.viewport.selectedService; },
    },

    methods: {
    },

};
</script>

<style scoped>
.api-header {
    display: flex;
    flex-flow: row nowrap;
    color: var(--ui-color--white);
}

.breadcrumbs {
    flex: 1;
    min-width: 0;
    align-self: center;
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    text-overflow: ellipsis;
}

.link {
    color: var(--ui-color--white);
    text-decoration: none;
}

.link::after {
    content: '›';
    margin: var(--gap--small);
    opacity: .5
}
</style>
