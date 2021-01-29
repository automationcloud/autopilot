<template>
    <div class="service-select">
        <div class="service-select__dropdown input stretch"
            @click="toggle"
            @blur="collapse">
            {{ serviceName || nullPlaceholder }}
            <span class="icon color--muted">
                <i class="fas fa-chevron-down"></i>
            </span>
        </div>
        <div class="service-select__wrapper">
            <div v-show="listShown" class="service-select__select">
                <input class="input stretch" type="search" v-model="searchText" placeholder="Search">
                <div class="service-select__list">
                    <span v-if="services.length === 0"
                        class="service-select__item"> No Automation found </span>
                    <span v-if="addNullOption"
                        class="service-select__item"
                        @click="onItemClick(null)">
                        {{ nullPlaceholder }}
                    </span>
                    <span
                        class="service-select__item"
                        v-for="service of services"
                        :key="service.id"
                        @click="onItemClick(service)">
                        {{ service.name }}
                    </span>
                </div>
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
.service-select__dropdown {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--gap--small);
    cursor: pointer;
}

.service-select__wrapper {
    position: relative;
}

.service-select__select {
    position: absolute;
    z-index: 10;
    border-radius: var(--border-radius);
    border: solid 1px var(--border-color);
    background: var(--color-mono--000);
    padding: var(--gap--small);
    width: 100%;
}

.service-select__list {
    margin: var(--gap--small) 0;
    max-height: 200px;
    overflow-y: auto;
}

.service-select__item {
    display: block;
    cursor: pointer;
    height: var(--control-height);
    text-overflow: ellipsis;
    padding: var(--gap--small);
}

.service-select__item:hover {
    background: var(--color-cool--200);
}
</style>
