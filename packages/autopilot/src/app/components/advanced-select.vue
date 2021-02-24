<template>
    <div class="advanced-select">
        <div class="input stretch"
            @focusin.stop="expand"
            @focusout.stop="onBlur"
            tabindex=0>
            <input class="advanced-select__text"
                v-model="search"
                @input="$emit('search', search)"
                :placeholder="placeholder"
                :disabled="!searchable">
                <span
                    class="icon">
                    <i class="fas fa-chevron-down"></i>
                </span>
        </div>
        <div v-show="listShown"
            class="advanced-select__list"
            @mouseover.stop="hoverOnList = true;"
            @mouseout.stop="hoverOnList = false;" >
            <span v-if="options.length === 0"
                class="advanced-select__item"> No Automation found </span>
            <span  class="advanced-select__item"
                v-for="option of options"
                v-html="option.html || option.name "
                @click="selectOption(option)"
                :key="option.id" >
            </span>
        </div>
    </div>
</template>

<script>
export default {

    props: {
        options: { type: Array, default() { return []; } },
        selectedOption: { type: Object, default: null }, // { id: string, name: string, html?: string }
        searchable: { type: Boolean, default: false },
        placeholder: { type: String, default: 'Search or select' },
    },

    data() {
        return {
            listShown: false,
            search: this.selectedOption ? this.selectedOption.name : '',
            hoverOnList: false,
        };
    },

    watch: {
        selectedOption(val) {
            // to display selected option name
            this.search = val ? val.name : '';
        },
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
            this.$emit('search', this.search);
            this.listShown = true;
        },

        collapse() {
            this.$emit('search', this.search);
            this.listShown = false;
        },

        onBlur() {
            if (this.hoverOnList) { // when losing focus to click the item, ignore
                return;
            }
            // when search is enabled, service is selected but the search is changed
            if (!this.selectedOption || this.selectedOption.name !== this.search) {
                this.$emit('change', null);
            }
            this.collapse();
        },

        selectOption(option) {
            this.$emit('change', option);
            this.collapse();
        }
    },
};
</script>

<style scoped>
.advanced-select__text {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--gap--small);
}

.advanced-select__text::placeholder {
    color: var(--color-mono--600);
}

.advanced-select__text:disabled {
    color: var(--ui-color--black);
}

.advanced-select__list {
    position: absolute;
    z-index: 10;
    border-radius: var(--border-radius);
    border: solid 1px var(--border-color);
    background: var(--color-cool--100);
    padding: var(--gap--small);
    width: 70%;
    max-height: 200px;
    overflow-y: auto;
}

.advanced-select__item {
    display: block;
    cursor: pointer;
    height: 100%;
    text-overflow: ellipsis;
    padding: var(--gap--small);
}

.advanced-select__item:hover {
    background: var(--color-cool--200);
}
</style>
