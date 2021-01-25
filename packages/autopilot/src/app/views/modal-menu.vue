<template>
    <transition name="fade-scale">
        <div class="modal-menu"
            ref="menu"
            v-if="modalMenu.shown"
            @keydown="onKeyDown"
            tabindex="0">

            <div class="overlay"
                @click="modalMenu.hide()">
            </div>

            <div :class="{
                    'content': true,
                    'content--wide': isHelpVisible,
                }">
                <div class="search">
                    <div class="input stretch"
                        :class="{ 'input--disabled': !isSearchable }">
                        <i class="icon color--muted fas fa-search"></i>
                        <input
                            ref="search"
                            v-model.trim="search"
                            v-focus
                            placeholder="Search"
                            :disabled="!isSearchable"
                            @input="onSearchInput"
                            @focus="onSearchFocus"
                            @keydown="onSearchKeyDown"/>
                    </div>
                </div>
                <div class="body">
                    <div class="main">
                        <!-- Breadcrumbs only displayed when not searching -->
                        <template v-if="!search">
                            <div class="breadcrumbs"
                                v-if="modalMenu.breadcrumbs.length">
                                <div class="breadcrumbs-link"
                                    @click="modalMenu.clearBreadcrumbs()">
                                    Main
                                </div>
                                <div class="breadcrumbs-link"
                                    v-for="(label, i) of breadcrumbsLinks"
                                    @click="modalMenu.clickBreadcrumbs(label)">
                                    {{ label }}
                                </div>
                                <div class="breadcrumbs-label">
                                    {{ breadcrumbsLast }}
                                </div>
                            </div>
                        </template>

                        <div class="items"
                            v-if="displayedItems.length">
                            <div v-for="(item, i) of displayedItems">
                                <div class="separator"
                                    v-if="item.type === 'separator'">
                                </div>
                                <div class="header"
                                    v-else-if="item.type === 'header'">
                                    {{ item.label }}
                                </div>
                                <div class="item"
                                    :class="{
                                        'item--disabled': item.enabled == false,
                                        'item--focused': i === focusIndex,
                                    }"
                                    v-else
                                    @click="onItemClick(item)"
                                    @mouseenter="onItemHover(item, i)">
                                    <div class="item-main">
                                        <div class="item-parent"
                                            v-if="item.parentLabels">
                                            <span class="item-parent-label"
                                                v-for="lbl in item.parentLabels">
                                                {{ lbl }}
                                            </span>
                                        </div>
                                        <div class="item-label">
                                            <span v-if="item.highlight"
                                                class="item-highlight"
                                                v-html="item.highlight">
                                            </span>
                                            <template v-else>
                                                <span v-if="item.htmlLabel"
                                                    v-html="item.htmlLabel">
                                                </span>
                                                <span v-else>
                                                {{ item.label }}
                                                </span>
                                            </template>
                                        </div>
                                    </div>
                                    <div class="item-help"
                                        :class="{
                                            'item-help--shown': helpItem === item
                                        }"
                                        v-if="item.help"
                                        @click.stop="toggleHelp(i)">
                                        <i class="far fa-question-circle">
                                        </i>
                                    </div>
                                    <div class="item-submenu"
                                        v-if="item.submenu">
                                        <i class="fas fa-chevron-right">
                                        </i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="items-empty"
                            v-if="!displayedItems.length">
                            Nothing found.
                        </div>
                    </div>

                    <div class="help-panel"
                        v-if="isHelpVisible">
                        <div class="help-panel-header">
                        </div>
                        <article v-html="helpItem.help">
                        </article>
                    </div>
                </div>

            </div>

        </div>
    </transition>
</template>

<script>
export default {

    data() {
        return {
            search: '',
            focusIndex: -1,
            helpItem: null
        };
    },

    computed: {

        modalMenu() {
            return this.app.ui.modalMenu;
        },

        isShown() {
            return this.modalMenu.shown;
        },

        isSearchable() {
            return this.modalMenu.isSearchable();
        },

        displayedItems() {
            return this.modalMenu.getDisplayedItems();
        },

        breadcrumbsLinks() {
            return this.modalMenu.breadcrumbs.slice(0, -1);
        },

        breadcrumbsLast() {
            return this.modalMenu.breadcrumbs.slice(-1)[0];
        },

        isHelpVisible() {
            return this.helpItem && this.displayedItems.includes(this.helpItem);
        },

    },

    watch: {

        'isShown'() {
            this.search = '';
            this.focusIndex = -1;
            this.helpItem = null;
        }

    },

    methods: {

        toggleHelp(idx) {
            const item = this.displayedItems[idx];
            this.helpItem = this.helpItem === item ? null : item;
        },

        hideHelp() {
            this.helpItem = -1;
        },

        onItemHover(item, index) {
            if (!this.modalMenu.isItemFocusable(item)) {
                return;
            }
            this.focusIndex = index;
        },

        onItemClick(item) {
            this.modalMenu.clickItem(item);
            this.focusIndex = -1;
        },

        getFocusedItem() {
            return this.displayedItems[this.focusIndex];
        },

        onSearchInput() {
            this.modalMenu.performSearch(this.search);
        },

        onSearchFocus() {
            this.focusIndex = -1;
        },

        onSearchKeyDown(ev) {
            switch (ev.key) {
                case 'ArrowUp':
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'Backspace':
                case 'Tab':
                    ev.stopPropagation();
                    return;
                case 'ArrowDown':
                    ev.stopPropagation();
                    this.focusIndex = -1;
                    this.$refs.menu.focus();
                    return this.focusNext();
            }
        },

        onKeyDown(ev) {
            switch (ev.key) {
                case 'Escape':
                    return this.modalMenu.hide();
                case 'Space':
                case 'Enter':
                    return this.clickFocused();
                case 'ArrowDown':
                    this.$refs.menu.focus();
                    return this.focusNext();
                case 'ArrowUp':
                    this.$refs.menu.focus();
                    return this.focusPrevious();
                case 'ArrowLeft':
                    this.$refs.menu.focus();
                    return this.goBack();
                case 'ArrowRight':
                    this.$refs.menu.focus();
                    return this.enterSubmenu();
                case 'Tab':
                case 'Backspace':
                    return this.$refs.search.focus();
            }
        },

        clickFocused() {
            const item = this.getFocusedItem();
            if (item) {
                this.onItemClick(item);
            }
        },

        enterSubmenu() {
            const item = this.getFocusedItem();
            if (item && item.submenu) {
                this.onItemClick(item);
            }
        },

        goBack() {
            const lastLabel = this.breadcrumbsLast;
            this.modalMenu.goBack();
            this.focusIndex = this.displayedItems.findIndex(_ => lastLabel === _.label);
        },

        focusNext() {
            this.$refs.search.blur();
            if (this.focusIndex >= (this.displayedItems.length - 1)) {
                return;
            }
            this.focusIndex += 1;
            const item = this.displayedItems[this.focusIndex];
            if (!item) {
                return;
            }
            if (!this.modalMenu.isItemFocusable(item)) {
                this.focusNext();
            }
            this.revealFocused();
        },

        focusPrevious() {
            this.$refs.search.blur();
            if (this.focusIndex <= -1) {
                return;
            }
            this.focusIndex -= 1;
            const item = this.displayedItems[this.focusIndex];
            if (!item) {
                this.$refs.search.focus();
                return;
            }
            if (!this.modalMenu.isItemFocusable(item)) {
                this.focusPrevious();
            }
            this.revealFocused();
        },

        revealFocused() {
            this.$nextTick(() => {
                const el = this.$refs.menu.querySelector('.item--focused');
                if (el) {
                    el.scrollIntoViewIfNeeded();
                }
            });
        }

    }

};
</script>

<style scoped>
.modal-menu {
    position: fixed;
    z-index: 2000;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 10vh 0;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: flex-start;
    outline: 0;
}

.overlay {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,.8);
}

.content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-flow: column nowrap;
    min-width: 300px;
    max-width: 300px;
    user-select: none;
    overflow-y: hidden;
    padding: 15px;
}

.search {
    padding: var(--gap);
    background: var(--color-mono--200);
    box-shadow: 0 3px 8px rgba(0,0,0,.25);
    border-radius: var(--border-radius) var(--border-radius) 0 0;
    border: 1px solid var(--color-mono--400);
    border-bottom-width: 0px;
}

.body {
    flex: 1 1 auto;
    display: flex;
    flex-flow: row nowrap;
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    border: 1px solid var(--color-mono--400);
    box-shadow: 0 3px 8px rgba(0,0,0,.25);
    overflow-y: inherit;
}

.main {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: #fff;
}

.breadcrumbs {
    display: flex;
    flex-flow: row wrap;
    line-height: 2em;
    align-items: center;
    padding: var(--gap);
    border-bottom: 1px solid var(--color-mono--300);
}

.breadcrumbs-separator {
    color: var(--color-brand-mono--100);
}

.breadcrumbs-link {
    display: flex;
    color: var(--color-blue--500);
    cursor: pointer;
}

.breadcrumbs-link::after {
    content: "\f054";
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    font-size: 10px;
    color: var(--color-mono--300);
    padding: 0 var(--gap--small);
}

.items {
    padding: var(--gap--small) 0;
}

.item {
    padding: var(--gap--small) var(--gap--large);
    display: flex;
    align-items: center;
    justify-content: space-between;
    white-space: nowrap;
    cursor: pointer;
}

.item--disabled {
    opacity: .3;
    cursor: not-allowed;
}

.item--focused {
    background: var(--color-blue--500);
    color: #fff;
}

.item-help {
    opacity: 0;
}

.item:hover .item-help {
    opacity: .5;
}

.item-help--shown {
    opacity: 1;
}

.item-submenu {
    opacity: .7;
}

.separator {
    margin: var(--gap--small) 0;
    border-bottom: 1px solid var(--color-mono--100);
}

.header {
    padding: var(--gap) var(--gap--large);

    font-size: var(--font-size--small);
    font-weight: 400;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ui-color--secondary);
}

.items-empty {
    padding: var(--gap);
    color: var(--color-mono--500);
}

.item-parent {
    display: flex;
    flex-flow: row nowrap;
    opacity: .5;
    font-size: var(--font-size--small);
}

.item-parent-label:not(:last-child)::after {
    content: "›";
    padding: 0 4px;
}

.item-label {
    line-height: 1.5;
}

.help-panel {
    flex: 1;
    background: var(--color-cool--100);
    padding: var(--gap);
    overflow-y: auto;
}

@media screen and (min-width: 670px) {
    .content--wide {
        max-width: 650px;
    }
}

@media screen and (max-width: 670px) {
    .content--wide {
        min-width: 100vw;
        padding-right: var(--gap);
        padding-left: var(--gap);
    }
}
</style>
