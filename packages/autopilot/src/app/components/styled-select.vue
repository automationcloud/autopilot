<template>
    <div class="styled-select">
        <div class="input stretch"
            @click="toggle">
            <input class="styled-select__multi"
                v-model="search"
                @focus="expand"
                @blur="onBlur"
                :placeholder="placeholder"
                :disabled="!searchable">
                <span
                    class="icon"
                    @click="toggle()">
                    <i class="fas fa-chevron-down"></i>
                </span>
        </div>
        <div
            v-show="listShown"
            class="styled-select__list"
            @mouseover="hoverOnList = true;"
            @mouseout="hoverOnList = false;" >
            <div class="styled-select__options">
                <span v-if="options.length === 0"
                    class="styled-select__item"> No Automation found </span>
                <span
                    class="styled-select__item"
                    v-for="option of options"
                    :key="option.id"
                    @click="selectOption(option.id)"
                    v-html="option.html || option.text ">
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {

    props: {
        options: { type: Array, default() { return []; } }, //id, text, html?
        selectedOptionId: { type: String, default: null },
        searchable: { type: Boolean, default: false },
        placeholder: { type: String, default: 'Search or select' },
    },

    data() {
        return {
            listShown: false,
            // search: '',
            hoverOnList: false,
        };
    },
    computed: {
        selectedOption() {
            return this.options.find(option => option.id === this.selectedOptionId) || null;
        },
        search: {
            get: function () {
                const selected = this.options.find(option => option.id === this.selectedOptionId) || null;
                return selected ? selected.text : '';
            },
            set: function(val) {
                return val;
            }
        }
    },

    watch: {
        /* selectedOptionId() {
            console.log('HELP!!', this.selectedOption)
            const selected = this.options.find(option => option.id === this.selectedOptionId) || null;
            this.search = selected ? selected.text : '';
        },
        */
    },

    methods: {

        toggle() {
            if (this.listShown) {
                this.collapse();
            } else {
                this.expand();
            }
        },

        expand() {
            this.listShown = true;
        },

        collapse() {
            this.listShown = false;
        },

        onBlur() {
            if (this.hoverOnList) { // when losing focus to click the item, ignore
                return;
            }
            // when search is enabled, service is selected but the search is changed
            if (this.selectedOption && this.selectedOption.name !== this.search) {
                this.$emit('change', null);
                this.search = '';
            }
            this.collapse();
        },

        selectOption(optioinId) {
            this.$emit('change', optioinId);
            this.collapse();
        }
    },
};
</script>

<style scoped>
.styled-select__multi {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--gap--small);
}

.styled-select__multi::placeholder {
    color: var(--color-mono--600);
}

.styled-select__multi::disabled {
    color: var(--color-mono--600);
}

.styled-select__wrapper {
    position: relative;
}

.styled-select__list {
    position: absolute;
    z-index: 10;
    border-radius: var(--border-radius);
    border: solid 1px var(--border-color);
    background: var(--color-mono--000);
    padding: var(--gap--small);
    width: 70%;
}

.styled-select__options {
    margin: var(--gap--small) 0;
    max-height: 200px;
    overflow-y: auto;
}

.styled-select__item {
    display: block;
    cursor: pointer;
    height: 100%;
    text-overflow: ellipsis;
    padding: var(--gap--small);
}

.styled-select__item:hover {
    background: var(--color-cool--200);
}
</style>
