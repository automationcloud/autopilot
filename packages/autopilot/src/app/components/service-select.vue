<template>
    <div class="service-select">
        <div class="input stretch">
            <input class="service-select__multi"
                @focus="expand"
                @blur="onBlur"
                v-model="text"
                :placeholder="placeholder">
                <span class="icon"
                    @click="toggle()">
                    <i class="fas fa-chevron-down"></i>
                </span>
        </div>
        <div v-show="listShown" class="service-select__list"
            @mouseover="hoverOnList = true;"
            @mouseout="hoverOnList = false;" >
            <div class="service-select__options">
                <span v-if="services.length === 0"
                    class="service-select__item"> No Automation found </span>
                <span
                    class="service-select__item"
                    v-for="service of services"
                    :key="service.id"
                    @click="selectService(service)">
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
        service: { type: Object, default: null },
        placeholder: { type: String, default: 'Search or select' },
    },

    mounted() {
        this.loadServices();
    },

    data() {
        return {
            services: [],
            listShown: false,
            text: '',
            hoverOnList: false,
        };
    },
    watch: {
        text(val) {
            this.loadServices(val);
        },
        service(val) {
            if (val) {
                this.text = val.name;
            }
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
            this.loadServices(this.text);
        },

        collapse() {
            this.listShown = false;
        },

        onBlur() {
            if(this.hoverOnList) { // when losing focus to click the item, ignore
                return;
            }
            // when service is selected but the text is changed
            if (this.service && this.service.name !== this.text) {
                this.$emit('change', null);
                this.text = '';
            }
            this.collapse();
        },

        selectService(service) {
            this.text = service.name;
            this.$emit('change', service);
            this.collapse();
        }
    },
};
</script>

<style scoped>
.service-select__multi {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--gap--small);
}

.service-select__multi::placeholder {
    color: var(--color-mono--600);
}

.service-select__wrapper {
    position: relative;
}

.service-select__list {
    position: absolute;
    z-index: 10;
    border-radius: var(--border-radius);
    border: solid 1px var(--border-color);
    background: var(--color-mono--000);
    padding: var(--gap--small);
    width: 70%;
}

.service-select__options {
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
