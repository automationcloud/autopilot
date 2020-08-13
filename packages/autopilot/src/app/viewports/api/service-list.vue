<template>
    <div class="service-list section">

        <div class="service-list__filters">
            <div class="service-list__search input stretch"
                @contextmenu.stop.prevent="popupMenu">
                <i class="icon fas fa-search color--mute"></i>
                <span class="tag"
                    v-if="controller.filters.domainId">
                    <span class="tag__label">
                        {{ controller.filters.domainId }}
                    </span>
                    <span class="tag__remover"
                        @click="controller.filters.domainId = null">
                        <i class="fa fa-times"></i>
                    </span>
                </span>
                <input data-selection-id="search"
                    tabindex="0"
                    v-model="controller.filters.name"
                    v-focus
                    v-select
                    placeholder="Filter services by name"
                    @keydown="onSearchKeydown"/>
                <button class="button button--icon frameless"
                    @click="controller.clearFilters()"
                    title="Clear all filters">
                    <i class="fa fa-times"></i>
                </button>
            </div>

        </div>

        <div class="section__title">
            Services ({{ controller.services.length }})
            <loader v-if="controller.loading"/>
        </div>

        <service-item v-for="service of controller.services"
            :key="service.id"
            :service="service"/>

        <div class="flexrow"
            v-if="controller.hasMore">
            <a @click="controller.loadMore()">
                Load more services
            </a>
        </div>

    </div>
</template>

<script>
import ServiceItem from './service-item.vue';
import { menu } from '../../util';

export default {

    components: {
        ServiceItem,
    },

    props: {

    },

    mounted() {
        this.controller.refresh();
    },

    computed: {
        viewport() { return this.app.viewports.api; },
        controller() { return this.viewport.services; },

        availableDomains() {
            return this.app.tools.getAvailableDomains();
        },
    },

    methods: {

        onSearchKeydown(ev) {
            switch (ev.key) {
                case 'ArrowDown':
                    ev.stopPropagation();
                    ev.preventDefault();
                    this.app.ui.navigation.focusSibling({
                        base: this.$el,
                        next: true,
                        event: 'uiselect'
                    });
                    break;
            }
        },

        popupMenu() {
            menu.popupMenu([
                {
                    label: 'Filter by domain',
                    submenu: this.availableDomains.map(domain => {
                        return {
                            label: domain.id,
                            click: () => this.controller.filters.domainId = domain.id,
                        };
                    }),
                },
            ]);
        },

    }

};
</script>

<style>
.service-list {
    padding: var(--gap);
}

</style>
