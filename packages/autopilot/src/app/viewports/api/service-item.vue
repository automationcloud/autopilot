<template>
    <div class="service-item flexrow"
        @click="selectService"
        @uiactivate="selectService"
        @uiexpand="selectService"
        tabindex="0"
        data-selection-id="service.id">
        <div class="service-item__name">
            {{ service.name }}
        </div>
        <div class="service-item__domain">
            <a class="service-item__filter-link"
                @click.stop="filterByDomain"
                title="Filter by this domain">
                <i class="fa fa-filter"></i>
            </a>
            <span>{{ service.domain }}</span>
        </div>
        <div class="flexrow__sizer">
        </div>
        <i class="flexrow__helper-icon fas fa-chevron-right"></i>
    </div>
</template>

<script>
export default {

    components: {

    },

    props: {
        service: { type: Object },
    },

    computed: {
        viewport() { return this.app.viewports.api; },
    },

    methods: {

        selectService() {
            this.viewport.selectService(this.service);
        },

        filterByDomain() {
            this.viewport.services.filters.domainId = this.service.domain;
            this.viewport.services.refresh();
        }

    }

};
</script>

<style>
.service-item {
    cursor: pointer;
}

.service-item__name {
    flex: 0 1 30%;
}

.service-item__domain {
    font-size: var(--font-size--small);
}

.service-item__filter-link {
    color: var(--ui-color--muted);
}
</style>
