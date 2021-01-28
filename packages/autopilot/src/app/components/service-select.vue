<template>
    <div class="search-select">
        <div class="search-select__select input stretch"
            @click="toggle"
            @blur="collapse">
            {{ serviceName || nullPlaceholder }}
            <span class="icon color--muted">
                <i class="fas fa-chevron-down"></i>
            </span>
        </div>
        <div v-show="listShown" class="search-select__pane">
            <input class="input stretch" type="search" v-model="searchText" placeholder="Search">
            <div class="search-select__list">
                <span v-if="services.length === 0"
                    class="search-select__item"> No Automation found </span>
                <span v-if="addNullOption"
                    class="search-select__item"
                    @click="onItemClick(null)">
                    {{ nullPlaceholder }}
                </span>
                <span
                    class="search-select__item"
                    v-for="service of services"
                    :key="service.id"
                    @click="onItemClick(service)">
                    {{ service.name }}
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    inject: [
        'api',
    ],

    props: {
        serviceId: String,
        addNullOption: { type: Boolean, default: false },
        nullPlaceholder: { type: String, default: 'Select automation' },
    },

    mounted() {
        this.loadServices();
    },

    data() {
        return {
            services: [],
            listShown: false,
            searchText: '',
        };
    },
    watch: {
        searchText(val) {
            this.loadServices(val);
        }
    },
    computed: {
        serviceName() {
            const service = this.services.find(_ => _.id === this.serviceId);
            return service ? service.name : null;
        }
    },
    methods: {
        async loadServices(name = '') {
            try {
                this.services = await this.api.getServices({ name, archived: false });
            } catch (error) {
                this.services = [];
            }
        },
        toggle() {
            if (this.listShown) {
                this.collapse();
            } else {
                this.expand();
            }
        },
        expand() {
            this.listShown = true;
            this.loadServices();
        },

        collapse() {
            this.listShown = false;
            this.searchText = '';
        },

        onItemClick(service) {
            this.$emit('change', service);
            this.collapse();
        }
    },
};
</script>

<style scoped>
.search-select__select {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--gap--small);
    cursor: pointer;
}

.search-select__pane {
    position: absolute;
    z-index: 10;
    border-radius: var(--border-radius);
    border: solid 1px var(--border-color);
    background: var(--color-mono--000);
    padding: var(--gap--small);
    width: 220px;
}

.search-select__list {
    margin: var(--gap--small) 0;
    max-height: 200px;
    overflow-y: auto;
}

.search-select__item {
    display: block;
    cursor: pointer;
    height: var(--control-height);
    text-overflow: ellipsis;
    padding: var(--gap--small);
}

.search-select__item:hover {
    background: var(--color-cool--200);
}
</style>
