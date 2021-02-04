<template>
    <div class="workspaces"
        ref="container">
        <div class="link link--hamburger"
            title="Workspaces"
            @click="popupWorkspacesMenu()">
            <i class="fas fa-bars"></i>
        </div>
        <div class="link link--item workspace__link"
            :class="{
                'link--active': isWorkspaceActive(i),
                'workspace__link--dnd--target': dnd.isDragging(),
            }"
            v-for="(workspace, i) in workspaces"
            @click="activateWorkspace(i)"
            @dblclick="editWorkspaceName(i)"
            @contextmenu.prevent.stop="popupWorkspaceItem(i)"
            draggable
            v-on="dnd.createListeners()"
            :data-index="i">

            <span v-if="editingIndex !== i">{{ workspace.name }}</span>
            <input class="edit-name"
                v-if="editingIndex === i"
                v-model="workspace.name"
                v-focus
                v-select
                @keydown="onWorkspaceNameKeydown"
                @blur="finishWorkspaceEditing"/>
        </div>
        <div class="link link--add"
            title="Add workspace"
            @click="addWorkspace()">
            <i class="fas fa-plus"></i>
        </div>
    </div>
</template>

<script>
import { menu, DragAndDrop } from '../util';

export default {

    inject: [
        'layout',
    ],

    data() {
        const dnd = new DragAndDrop({ className: 'workspace__link' });
        dnd.on('dnd', this.onDragAndDrop);
        return {
            editingIndex: -1,
            editingName: '',
            dnd,
        };
    },

    computed: {

        workspaces() {
            return this.layout.workspaces;
        },

    },

    mounted() {
        this.dnd.container = this.$refs.container;
    },

    destroyed() {
    },

    methods: {

        isWorkspaceActive(i) {
            return this.layout.activeWorkspaceIndex === i;
        },

        activateWorkspace(i) {
            this.layout.activateWorkspace(i);
        },

        editWorkspaceName(i) {
            this.editingIndex = i;
            this.editingName = this.workspaces[i].name;
        },

        onWorkspaceNameKeydown(ev) {
            switch (ev.key) {
                case 'Enter':
                    return this.finishWorkspaceEditing();
                case 'Escape':
                    this.workspaces[this.editingIndex].name = this.editingName;
                    return this.finishWorkspaceEditing();
            }
        },

        finishWorkspaceEditing() {
            this.editingIndex = -1;
            this.layout.update();
        },

        addWorkspace() {
            this.layout.addWorkspace();
            this.editWorkspaceName(this.layout.activeWorkspaceIndex);
        },

        popupWorkspacesMenu() {
            const items = [];
            for (const [i, w] of this.workspaces.entries()) {
                items.push({
                    label: w.name,
                    click: () => this.activateWorkspace(i),
                    checked: this.isWorkspaceActive(i),
                });
            }
            menu.popupMenu([
                ...items,
                { type: 'separator' },
                {
                    label: 'Add workspace',
                    click: () => {
                        this.addWorkspace();
                    }
                }
            ]);
        },

        popupWorkspaceItem(i) {
            menu.popupMenu([
                {
                    label: 'Rename workspace',
                    click: () => {
                        this.editWorkspaceName(i);
                    }
                },
                {
                    label: 'Remove workspace',
                    click: () => {
                        this.layout.removeWorkspace(i);
                    }
                }
            ]);
        },

        onDragAndDrop(srcIndex, dstIndex) {
            const activeWorkspace = this.workspaces[this.layout.activeWorkspaceIndex];
            const workspace = this.workspaces[srcIndex];
            this.workspaces.splice(srcIndex, 1);
            this.workspaces.splice(dstIndex, 0, workspace);
            this.layout.activeWorkspaceIndex = this.workspaces.indexOf(activeWorkspace);
        }

    }

};
</script>

<style scoped>
.workspaces {
    flex: 1;
    display: flex;
    flex-flow: row nowrap;
    min-width: 0;
    overflow: hidden;
}

.edit-name {
    background: transparent;
    color: #fff;
    border: 0;
    width: auto;
    padding: 0;
    margin: 0;
}

.link {
    position: relative;
    flex: 0 0 auto;
    min-width: 24px;
    padding: var(--gap--small) var(--gap);

    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;

    font-weight: 400;
    -webkit-app-region: no-drag;
    cursor: pointer;
}

.link--active {
    box-shadow: 0 -3px 0 var(--color-blue--500) inset;
}

.workspace__link--dnd--target {
    box-shadow: none;
}

.workspace__link--dnd--target * {
    pointer-events: none;
}

.workspace__link--dnd--before {
    border-left: 2px solid var(--color-blue--500);
}

.workspace__link--dnd--after {
    border-right: 2px solid var(--color-blue--500);
}

.link--add {
    transition: opacity .3s;
    opacity: .5;
}

.link--add:hover {
    opacity: 1;
}

@media screen and (min-width: 481px) {
    .link--hamburger {
        display: none;
    }
}

@media screen and (max-width: 480px) {
    .link--item:not(.link--active) {
        display: none;
    }
}
</style>
