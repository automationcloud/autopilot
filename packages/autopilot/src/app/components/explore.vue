<template>
    <div class="explore">
        <div v-for="(value, key) of data"
            class="explore__item">
            <div class="explore__line"
                :class="{
                    'explore__line--expandable': canExpand(value),
                    'explore__line--expanded': isExpanded(key)
                }"
                @click="toggleExpand(key, value)"
                @contextmenu.prevent.stop="onContextMenu($event, key, value)">
                <div class="explore__expand">
                    <i
                        v-if="canExpand(value)"
                        class="fas"
                        :class="{
                            'fa-caret-right': !isExpanded(key),
                            'fa-caret-down': isExpanded(key)
                        }"></i>
                    <span v-else style="opacity: .5">∙</span>
                </div>
                <div class="explore__key">{{ transformKey(key) }}</div>
                <div class="explore__value"
                    :class="'explore__value--' + getType(value)">
                    {{ stringify(value) }}
                </div>
            </div>
            <explore v-if="isExpanded(key) && canExpand(value)"
                :data="value"
                :options="options"/>
        </div>
    </div>
</template>

<script>
import { util } from '@automationcloud/engine';
import { menu, clipboard } from '../util';

export default {

    name: 'explore',

    props: {
        scope: { type: Object, required: false },
        data: {},
        options: { type: Object }
    },

    data() {
        const {
            expanded = false,
            types = true,
            indexBase = 0
        } = this.options || {};
        const expandedKeys = [];
        if (expanded && this.getType(this.data) === 'object') {
            expandedKeys.push(...Object.keys(this.data));
        }
        return {
            expandedKeys,
            types,
            indexBase
        };
    },

    methods: {

        isExpanded(key) {
            return this.expandedKeys.includes(key);
        },

        toggleExpand(key, value) {
            if (!this.canExpand(value)) {
                return;
            }
            const i = this.expandedKeys.indexOf(key);
            if (i === -1) {
                this.expandedKeys.push(key);
            } else {
                this.expandedKeys.splice(i, 1);
            }
        },

        getType(value) {
            return util.getType(value);
        },

        canExpand(value) {
            const type = this.getType(value);
            switch (type) {
                case 'array':
                    return value.length > 0;
                case 'object':
                    return Object.keys(value).length > 0;
                default:
                    return false;
            }
        },

        stringify(value) {
            const type = this.getType(value);
            switch (type) {
                case 'null':
                    return this.types ? 'null' : '';
                case 'array':
                    return this.types ? `array [${value.length}]` : `(${value.length})`;
                case 'object':
                    const keys = Object.keys(value);
                    if (!this.types) {
                        return `(${keys.length})`;
                    }
                    const pluralKeys = `key${keys.length === 1 ? '' : 's'}`;
                    return `{${keys.length} ${pluralKeys}}`;
                case 'string':
                    if (value.length > 200) {
                        return value.substring(0, 200) + '...';
                    }
                    return value;
                case 'node':
                    return value.$el.description;
                default:
                    return this.types ? `${value} (${type})` : String(value);
            }
        },

        onContextMenu(ev, key, value) {
            menu.popupMenu([
                {
                    label: 'Copy value',
                    click: () => {
                        clipboard.writeObject(value);
                    }
                }
            ]);
        },

        transformKey(key) {
            if (this.getType(this.data) === 'array') {
                return key + this.indexBase;
            }
            return key;
        },

    }

};
</script>

<style>
.explore__item {
    display: block;
}

.explore__item .explore {
    border-left: 1px dotted rgba(0,0,0,.25);
    padding-left: calc(var(--gap) - 2px);
    margin-left: 2px;
}

.explore__line {
    display: flex;
    align-items: center;
    font-family: var(--font-family--mono);
    font-weight: var(--font-weight--mono);
    font-size: var(--font-size--mono);
    line-height: 1.5;
}

.explore__line--expandable {
    cursor: pointer;
}

.explore__expand {
    width: 1em;
}

.explore__key {
    white-space: nowrap;
    position: relative;
    font-weight: 600;
}

.explore__value {
    margin-left: var(--gap);
    word-break: break-word;
    /* color: var(--color-brand-blue--500); */
    opacity: .8;
}

</style>
