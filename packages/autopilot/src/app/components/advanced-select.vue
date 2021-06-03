<template>
    <div class="advanced-select"
        @focusin.stop="expand"
        @focusout.stop="onBlur"
        @keydown="onKeyDown"
        tabindex=0 >
        <div class="input stretch">
            <input class="search"
                ref="search"
                v-model="search"
                @input="onSearch"
                :placeholder="placeholder"
                :disabled="!searchable">
                <span
                    class="icon">
                    <i class="fas fa-chevron-down"></i>
                </span>
        </div>
        <div v-show="listShown"
            class="list"
            ref="selectList">
            <span v-if="options.length === 0"
                class="item"> No Automation found </span>
            <span class="item"
                :class="{
                    'item--focused': i === focusIndex,
                }"
                v-for="(option, i) of options"
                v-html="option.html || option.name"
                :key="option.id"
                @click="onItemClick(option)"
                @mouseenter="onItemHover(i)" >
            </span>
        </div>
    </div>
</template>

<script>
export default {

    props: {
        options: { type: Array, default: [] },
        selectedOption: { type: Object, default: null }, // { id: string, name: string, html?: string }
        searchable: { type: Boolean, default: false },
        placeholder: { type: String, default: 'Search or select' },
    },

    data() {
        return {
            listShown: false,
            search: this.selectedOption ? this.selectedOption.name : '',
            focusIndex: -1,
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
            this.$refs.search.select();
            this.$emit('search', this.search);
            this.listShown = true;
        },

        collapse() {
            this.listShown = false;
            this.focusIndex = -1;
        },

        onBlur() {
            // when search is enabled, item is selected but the search is changed
            if (!this.selectedOption || this.selectedOption.name !== this.search) {
                this.$emit('change', null);
            }
            this.collapse();
        },

        onSearch() {
            if (!this.listShown) {
                this.expand();
            }
            this.$emit('search', this.search)
        },

        selectItem(item) {
            this.$emit('change', item);
            this.collapse();
        },

        // navigate with keydown
        onItemHover(index) {
            this.focusIndex = index;
        },

        onItemClick(item) {
            this.selectItem(item);
            this.focusIndex = -1;
        },

        getFocusedItem() {
            return this.options[this.focusIndex];
        },

        onKeyDown(ev) {
            if (!this.listShown) {
                return;
            }
            switch (ev.key) {
                case 'Space':
                case 'Enter':
                case 'ArrowRight':
                    return this.clickFocused();
                case 'ArrowDown':
                    this.$refs.selectList.focus();
                    return this.focusNext();
                case 'ArrowUp':
                    this.$refs.selectList.focus();
                    return this.focusPrevious();
                case 'ArrowLeft':
                case 'Tab':
                case 'Backspace':
                case 'Control':
                case 'Meta':
                    this.$refs.search.focus();
                default:
                    return this.focusIndex = -1;
            }
        },

        clickFocused() {
            const item = this.getFocusedItem();
            if (item) {
                this.onItemClick(item);
            }
        },
        
        focusNext() {
            if (this.focusIndex >= (this.options.length - 1)) {
                return;
            }
            this.focusIndex += 1;
            const item = this.options[this.focusIndex];
            if (!item) {
                return;
            }
            this.revealFocused();
        },

        focusPrevious() {
            if (this.focusIndex <= -1) {
                return;
            }
            this.focusIndex -= 1;
            const item = this.options[this.focusIndex];
            if (!item) {
                return;
            }
            this.revealFocused();
        },

        revealFocused() {
            this.$nextTick(() => {
                console.log('focused:', this.focusIndex);
                const el = this.$refs.selectList.querySelector('.item--focused');
                if (el) {
                    el.scrollIntoViewIfNeeded();
                }
            });
        }
    },
};
</script>

<style scoped>
.search {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--gap--small);
}

.search::placeholder {
    color: var(--color-mono--600);
}

.search:disabled {
    color: var(--ui-color--black);
}

.list {
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

.item {
    display: block;
    cursor: pointer;
    height: 100%;
    text-overflow: ellipsis;
    padding: var(--gap--small);
}

.item--focused {
    background: var(--color-blue--500);
    color: #fff;
}

</style>
