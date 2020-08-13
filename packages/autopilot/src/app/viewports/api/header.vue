<template>
    <div class="api-header">
        <div class="api-header__breadcrumbs">
            <a class="api-header__link"
                @click="viewport.goToServices()">
                Services
            </a>
            <a class="api-header__link"
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

<style>
.api-header {
    display: flex;
    flex-flow: row nowrap;
}

.api-header__breadcrumbs {
    flex: 1;
    min-width: 0;
    align-self: center;
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    text-overflow: ellipsis;
}

.api-header__link {
    color: var(--ui-color--white);
    text-decoration: none;
}

.api-header__link::after {
    content: '›';
    margin: var(--gap--small);
    opacity: .5
}
</style>
