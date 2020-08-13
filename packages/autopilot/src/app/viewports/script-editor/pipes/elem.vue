<template>
    <div class="elem"
        @mouseenter="onEnter"
        @mouseleave="onLeave">
        <div class="elem__header"
            @click="toggleExpand">
            <i class="elem__expand fa"
                :class="{
                    'fa-caret-right': !expanded,
                    'fa-caret-down': expanded,
                }">
            </i>
            <span class="elem__preview">
                <span class="elem__tagname"
                    :title="el.description">
                    {{ el.description }}
                </span>
                <span class="elem__value-type">
                    {{ dataType }}
                </span>
                <span class="elem__value-data">
                    {{ dataPreview }}
                </span>
            </span>
        </div>
        <div class="elem__body"
            v-if="expanded">
            <explore
                :scope="el"
                :data="inspectableObject"
                :options="{ expanded: true }"/>
        </div>
    </div>
</template>

<script>
import { util } from '@automationcloud/engine';

export default {

    props: {
        el: { type: Object, required: true }
    },

    data() {
        return {
            expanded: false
        };
    },

    computed: {

        inspectableObject() {
            return {
                value: this.el.value
            };
        },

        dataType() {
            return util.getType(this.el.value);
        },

        dataPreview() {
            const str = JSON.stringify(this.el.value, null, 2);
            return str.length > 100 ? str.substring(0, 100) + '…' : str;
        }

    },

    destroyed() {
        this.el.remote.hideHighlight();
    },

    methods: {

        onEnter() {
            this.el.remote.highlight();
        },

        onLeave() {
            this.el.remote.hideHighlight();
        },

        toggleExpand() {
            this.expanded = !this.expanded;
        }

    }

};
</script>

<style>
.elem {

}

.elem__header {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    white-space: nowrap;
    cursor: pointer;
}

.elem__expand {
    width: 1em;
}

.elem__preview {
    font-family: var(--font-family--mono);
    font-weight: var(--font-weight--mono);
    font-size: var(--font-size--mono);

    display: flex;
    flex-flow: row nowrap;
    min-width: 100%;
    max-width: 100%;
}

.elem__tagname {
    margin-left: .5em;
    color: var(--color-yellow--600);
    max-width: 25%;
    flex: 0 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
}

.elem__value-type {
    margin: 0 .5em;
    flex: 0 0 auto;
    color: var(--color-brand-blue--700);
}

.elem__value-data {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.elem--inverse .elem__tagname {
    color: var(--color-yellow--500);
}

.elem--inverse .elem__value-type {
    color: var(--color-brand-blue--500);
}

.elem__value-data {
    flex: 1;
}

.elem__body {
    padding-left: 1.5em;
}
</style>
