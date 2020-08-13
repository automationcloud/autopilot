<template>
    <div class="workspaces"
        ref="container">
        <div class="workspaces__link"
            :class="{
                'workspaces__link--active': isWorkspaceActive(i),
                'workspaces__link--dnd--target': dnd.isDragging(),
            }"
            v-for="(workspace, i) in visibleWorkspaces"
            @click="activateWorkspace(i)"
            @dblclick="editWorkspaceName(i)"
            @contextmenu.prevent.stop="popupWorkspaceItem(i)"
            draggable
            v-on="dnd.createListeners()"
            :data-index="i">

            <span v-if="editingIndex !== i">{{ workspace.name }}</span>
            <input class="workspaces__edit-name"
                v-if="editingIndex === i"
                v-model="workspace.name"
                v-focus
                v-select
                @keydown="onWorkspaceNameKeydown"
                @blur="finishWorkspaceEditing"/>
        </div>
        <div class="workspaces__link workspaces__link--menu"
            title="Workspaces menu"
            @click="popupWorkspacesMenu">
            <i class="fas fa-chevron-down"></i>
        </div>

        <!-- Iterate all the links once more to evaluate their widths -->
        <div class="workspaces__link workspaces__link--hidden"
            v-for="(workspace, i) in workspaces">
            {{ workspace.name }}
        </div>
    </div>
</template>

<script>
import { menu, DragAndDrop } from '../util';

export default {

    data() {
        const dnd = new DragAndDrop({ className: 'workspaces__link' });
        dnd.on('dnd', this.onDragAndDrop);
        return {
            editingIndex: -1,
            editingName: '',
            visibleLinksCount: +Infinity,
            linkWidths: [],
            dnd,
        };
    },

    computed: {

        workspaces() {
            return this.app.layout.workspaces;
        },

        visibleWorkspaces() {
            return this.app.layout.workspaces.slice(0, this.visibleLinksCount);
        },

        otherWorkspaces() {
            return this.app.layout.workspaces.slice(this.visibleLinksCount);
        },

    },

    mounted() {
        this.dnd.container = this.$refs.container;
        this.relayoutLinks();
        window.addEventListener('resize', this.onResize);
    },

    destroyed() {
        window.removeEventListener('resize', this.onResize);
    },

    watch: {
        workspaces: {
            deep: true,
            handler() {
                this.$nextTick(() => this.relayoutLinks());
            }
        }
    },

    methods: {

        isWorkspaceActive(i) {
            return this.app.layout.activeWorkspaceIndex === i;
        },

        activateWorkspace(i) {
            this.app.layout.activateWorkspace(i);
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
            this.app.layout.update();
        },

        popupWorkspacesMenu() {
            const others = this.otherWorkspaces.map((w, i) => {
                return {
                    label: w.name,
                    click: () => this.activateWorkspace(i + this.visibleLinksCount),
                };
            });
            menu.popupMenu([
                ...others,
                {
                    label: 'Add workspace',
                    click: () => {
                        this.app.layout.addWorkspace();
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
                        this.app.layout.removeWorkspace(i);
                    }
                }
            ]);
        },

        relayoutLinks() {
            const cnt = this.$refs.container;
            this.linkWidths = [...cnt.querySelectorAll('.workspaces__link--hidden')]
                .map(l => l.offsetWidth);
            this.onResize();
        },

        onResize() {
            const cnt = this.$refs.container;
            const menuWidth = cnt.querySelector('.workspaces__link--menu').offsetWidth;
            let remainingWidth = cnt.offsetWidth - menuWidth;
            this.visibleLinksCount = this.linkWidths.length;
            for (let i = 0; i < this.linkWidths.length; i += 1) {
                const w = this.linkWidths[i];
                if (remainingWidth < w) {
                    this.visibleLinksCount = i;
                    break;
                }
                remainingWidth -= w;
            }
        },

        onDragAndDrop(srcIndex, dstIndex) {
            const activeWorkspace = this.workspaces[this.app.layout.activeWorkspaceIndex];
            const workspace = this.workspaces[srcIndex];
            this.workspaces.splice(srcIndex, 1);
            this.workspaces.splice(dstIndex, 0, workspace);
            this.app.layout.activeWorkspaceIndex = this.workspaces.indexOf(activeWorkspace);
        }

    }

};
</script>

<style>
.workspaces {
    flex: 1;
    display: flex;
    flex-flow: row nowrap;
    min-width: 0;
    overflow: hidden;
}

.workspaces__edit-name {
    background: transparent;
    color: #fff;
    border: 0;
    width: auto;
    padding: 0;
    margin: 0;
}

.workspaces__link {
    position: relative;
    flex: 0 0 auto;
    min-width: 24px;
    padding: var(--gap--small) var(--gap);

    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;

    font-size: 12px;
    font-weight: 500;
    -webkit-app-region: no-drag;
}

.workspaces__link--active {
    box-shadow: 0 -3px 0 var(--color-blue--500) inset;
}

.workspaces__link--dnd--target {
    box-shadow: none;
}

.workspaces__link--dnd--target * {
    pointer-events: none;
}

.workspaces__link--dnd--before {
    border-left: 2px solid var(--color-blue--500);
}

.workspaces__link--dnd--after {
    border-right: 2px solid var(--color-blue--500);
}

.workspaces__link--hidden {
    visibility: hidden;
    transform: translate(0, -999999999px);
}
</style>
