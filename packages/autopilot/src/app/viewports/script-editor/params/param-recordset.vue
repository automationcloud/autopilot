<template>
    <div class="param--recordset">

        <div class="recordset__title">
            {{ label }}
        </div>

        <table class="recordset__records">
            <thead>
                <tr class="recordset__record">
                    <th></th>
                    <th v-for="field of param.fields"
                        class="recordset__th">
                        {{ field.name }}
                    </th>
                    <th></th>
                </tr>
            </thead>
            <tbody ref="container">
                <tr class="recordset__record"
                    :class="{
                        'recordset__record--dnd-target': dnd.isDragging(),
                    }"
                    v-for="(record, i) of records"
                    draggable
                    v-on="dnd.createListeners()"
                    :data-index="i">

                    <td class="recordset__record-dnd-handle">
                    </td>

                    <td class="recordset__field"
                        v-for="field of param.fields">

                        <autocomplete
                            input-class=""
                            v-if="field.type === 'string'"
                            v-model="record[field.name]"
                            @input="flush"
                            :placeholder="field.name"
                            :options="createSourceOptions(field.source)"/>

                        <input class="input input--block"
                            v-if="field.type === 'number'"
                            type="number"
                            :value="record[field.name]"
                            @input="onNumberInput(record, field, $event.target.value)"
                            :placeholder="field.name"/>

                        <sb v-if="field.type === 'selector'"
                            v-model="record[field.name]"
                            @input="flush"
                            :scope-el="el ? el.remote : null"
                            :allow-configure="false"
                            :key="item.id"/>

                        <select
                            class="input input--block"
                            v-if="field.type === 'enum'"
                            v-model="record[field.name]"
                            @change="flush">
                            <option v-for="v of field.enum" :value="v" :label="v">
                            </option>
                        </select>

                        <input v-if="field.type === 'boolean'"
                            type="checkbox"
                            v-model="record[field.name]"
                            :placeholder="field.name"
                            @change="flush"/>

                    </td>

                    <td class="recordset__remove"
                        @click="removeRecord(i)">
                        <i class="fas fa-times-circle"></i>
                    </td>
                </tr>
            </tbody>
        </table>

        <button class="button button--primary"
            @click="addRecord()">
            Add {{ param.singular }}
        </button>

    </div>
</template>

<script>
import { util } from '@automationcloud/engine';
import { DragAndDrop } from '../../../util';
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin],

    data() {
        const dnd = new DragAndDrop({
            className: 'recordset__record',
            handleClassName: 'recordset__record-dnd-handle',
        });
        dnd.on('dnd', this.onDragAndDrop);
        return {
            dnd,
            records: [],
        };
    },

    watch: {
        originalRecords: {
            deep: true,
            handler() {
                this.syncLocalState();
            }
        }
    },

    mounted() {
        this.dnd.container = this.$refs.container;
        this.syncLocalState();
    },

    computed: {

        // we'll watch this property to sync local state
        originalRecords() {
            return this.value;
        },

        isDragging() {
            return this.dragIndex > -1;
        },

    },

    methods: {

        syncLocalState() {
            this.records = this.originalRecords;
        },

        addRecord() {
            const newItem = {};
            for (const field of this.param.fields) {
                newItem[field.name] = field.value;
            }
            this.records.push(newItem);
            this.flush();
        },

        removeRecord(i) {
            this.records.splice(i, 1);
            this.flush();
        },

        onNumberInput(item, field, value) {
            const num = value ? parseFloat(value) : null;
            const val = isNaN(num) ? null : num;
            item[field.name] = val;
            this.flush();
        },

        flush() {
            this.value = util.deepClone(this.records);
        },

        onDragAndDrop(srcIndex, dstIndex) {
            const r = this.records[srcIndex];
            this.records.splice(srcIndex, 1);
            this.records.splice(dstIndex, 0, r);
            this.flush();
        },

    }

};
</script>

<style>
.recordset {
    margin: var(--gap) 0;
}

.recordset__records {
    margin: var(--gap--small) 0;
    width: 100%;
}

.recordset__record {
    border-bottom: 1px solid var(--color-warm--300);
}

.recordset__record--dnd-target * {
    /* pointer-events: none; */
}

.recordset__record--dnd--before {
    border-top: 2px solid var(--color-blue--500);
}

.recordset__record--dnd--after {
    border-bottom: 2px solid var(--color-blue--500);
}

.recordset__record-dnd-handle {
    width: 6px;
    cursor: ns-resize;
    background: url("./drag-handle.svg") repeat;
}

.recordset__field, .recordset__th {
    padding: 2px;
    vertical-align: middle;
}

.recordset__th {
    color: var(--color-warm--700);
    font-size: var(--font-size--small);
}

.recordset__remove {
    color: var(--color-warm--500);
    vertical-align: middle;
}

.recordset__remove:hover {
    color: var(--color-red--500);
}
</style>
