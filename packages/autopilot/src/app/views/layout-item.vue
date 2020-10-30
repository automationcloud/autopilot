<template>
    <div class="layout-item"
        :class="[
            widthClassName,
            'layout-item--' + layoutItem.type,
        ]"
        :style="style"
        ref="container">
        <div class="layout-item__overlay"
            v-if="resizing">
        </div>
        <template v-if="layoutItem.type === 'viewport'">
            <layout-viewport class="layout-item__viewport"
                :layout-item="layoutItem"/>
        </template>
        <template v-else>
            <template v-for="(child, i) of layoutItem.children">
                <div class="layout-item__resize"
                    :class="{
                        'layout-item__resize--active': resizing === i,
                    }"
                    @mousedown.stop="startResize(i)"
                    v-if="i > 0">
                </div>
                <layout-item
                    :key="i"
                    :layout-item="child"/>
            </template>
        </template>
    </div>
</template>

<script>
import LayoutViewport from './layout-viewport.vue';
import { EventEmitter } from 'events';

const events = new EventEmitter();

export default {
    name: 'layout-item',

    inject: [
        'layout'
    ],

    components: {
        LayoutViewport
    },

    data() {
        return {
            resizing: 0,
            width: 0,
        };
    },

    props: {
        layoutItem: { type: Object, required: true },
    },

    computed: {
        style() {
            return `flex-basis: ${this.layoutItem.size * 100}%`;
        },
        widthClassName() {
            const w = this.width >= 480 ? 'l' :
                this.width >= 320 ? 'm' : 's';
            return `layout-item--width--${w}`;
        }
    },

    mounted() {
        window.addEventListener('resize', this.updateSize);
        events.addListener('resize', this.updateSize);
        this.updateSize();
    },

    destroyed() {
        window.removeEventListener('resize', this.updateSize);
        events.removeListener('resize', this.updateSize);
    },

    methods: {

        startResize(index) {
            this.resizing = index;
            this.cntBox = this.$refs.container.parentElement.getBoundingClientRect();
            window.addEventListener('mousemove', this.onResize);
            window.addEventListener('mouseup', this.stopResize);
            window.addEventListener('mouseleave', this.stopResize);
        },

        stopResize() {
            this.resizing = false;
            window.removeEventListener('mousemove', this.onResize);
            window.removeEventListener('mouseup', this.stopResize);
            window.removeEventListener('mouseleave', this.stopResize);
            this.layout.update();
        },

        onResize(ev) {
            const i = this.resizing;
            const { layoutItem, cntBox } = this;
            const { children } = layoutItem;
            const snapPoints = [0.25, 0.5, 0.75];
            // Absolute coordinate in container space
            const p = layoutItem.type === 'column' ?
                (ev.clientY - cntBox.top) / cntBox.height :
                (ev.clientX - cntBox.left) / cntBox.width;
            // We will resize two children: A <-> B
            const a = children[i - 1];
            const b = children[i];
            // Size of all siblings preceding A
            const s = range(0, i - 1).reduce((size, i) => size + children[i].size, 0);
            // Snap to midpoint between A and B
            let snappedP = p;
            snapPoints.push(s + (a.size + b.size) / 2);
            for (const snap of snapPoints) {
                if (Math.abs(p - snap) < 0.01) {
                    snappedP = snap;
                }
            }
            // Calculate size of A first
            const aSize = snappedP - s;
            // B gets everything else
            const bSize = a.size + b.size - aSize;
            a.size = aSize;
            b.size = bSize;
            events.emit('resize');
        },

        updateSize() {
            this.width = this.$refs.container.offsetWidth;
        },

    }

};

function range(from, to) {
    const res = [];
    for (let i = from; i < to; i += 1) {
        res.push(i);
    }
    return res;
}
</script>

<style>
.layout-item {
    position: relative;
    flex: 1 1 auto;
    display: flex;
    align-items: stretch;
    min-width: 0;
    min-height: 0;
}

.layout-item--row {
    flex-flow: row nowrap;
}

.layout-item--column {
    flex-flow: column nowrap;
}

.layout-item__resize {
    z-index: 1000;
    user-select: none;
}

.layout-item__resize--active {
    background: var(--color-blue--500);
}

.layout-item--row > .layout-item__resize {
    width: 6px;
    margin-left: -3px;
    margin-right: -3px;
    cursor: ew-resize;
}

.layout-item--column > .layout-item__resize {
    height: 6px;
    margin-top: -3px;
    margin-bottom: -3px;
    cursor: ns-resize;
}
</style>
