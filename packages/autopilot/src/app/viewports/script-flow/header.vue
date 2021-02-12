<template>
    <div class="script-flow-header">
        <div class="main">
            <div class="item"
                :class="{
                    'item--selected': isSelected
                }"
                :data-selection-id="script.id"
                :data-selected="isSelected"
                tabindex="0"
                @click.prevent="onUiSelect"
                @uiselect="onUiSelect"
                @uiactivate="onUiActivate"
                @contextmenu.prevent.stop="onUiActivate">
                <span class="script">
                    {{ metadata.serviceName }}
                </span>
                <span class="domain"
                    v-if="domain">
                    {{ domain.id }}
                </span>
            </div>
        </div>
        <div class="aside">
            <button class="button button--inverse button--icon frameless"
                :class="{
                    'button--inverse--active': isSearchShown
                }"
                title="Search script"
                @click="toggleSearch">
                <i class="fas fa-search"></i>
            </button>
        </div>
    </div>
</template>

<script>
export default {

    inject: [
        'protocol',
        'project',
    ],

    computed: {

        script() {
            return this.project.script;
        },

        metadata() {
            return this.project.automation.metadata;
        },

        domain() {
            return this.protocol.getDomain();
        },

        viewport() {
            return this.app.viewports.scriptFlow;
        },

        isSelected() {
            return this.viewport.getSelectedList() == null;
        },

        isSearchShown() {
            return this.viewport.search.shown;
        },

    },

    methods: {

        onUiSelect() {
            this.viewport.clearSelection();
        },

        onUiActivate() {
            // TODO add script menu
        },

        toggleSearch() {
            this.viewport.search.shown = !this.viewport.search.shown;
        },

    }

};
</script>

<style scoped>
.script-flow-header {
    display: flex;
    flex-flow: row nowrap;
}

.main {
    flex: 1;
    display: flex;
    min-width: 0;
}

.aside {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    padding-left: var(--gap--small);
}

.item {
    align-self: center;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: var(--gap--small);
    border-radius: var(--border-radius);
    color: var(--ui-color--white);
    cursor: pointer;
}

.item--selected {
}

.item:focus {
    outline: 0;
    box-shadow: 0 0 0 2px var(--color-blue--500) inset;
}

.script {
    font-weight: 500;
}

.domain {
    margin-left: var(--gap--small);
    color: var(--color-blue--400);
}

.button.button.button--accent {
    color: var(--ui-color--accent);
}
</style>
