<template>
    <div class="configuration pane"
        ref="container">
        <div class="pane__item"
            v-for="entry of settings.getEntries()"
            :key="entry[0]">
            <div class="pane__main">
                {{ entry[0] }}
            </div>
            <div class="pane__aside">
                <input class="input input--small"
                    :data-entry-key="entry[0]"
                    :value="entry[1]"
                    @input="settings.setValue(entry[0], $event.target.value)"/>
                <button class="button button--secondary button--small button--icon"
                    @click="settings.removeValue(entry[0])"
                    title="Delete property">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="pane__item">
            <div class="pane__main">
                <select class="input input--small" v-model="addKey">
                    <option v-for="key of settings.getAvailableKeys()"
                        :key="key"
                        :label="key"
                        :value="key">
                    </option>
                </select>
                <select class="input input--small" v-model="addSuffix">
                    <option label="default" value=""></option>
                    <option label="staging" value=":staging"></option>
                    <option label="production" value=":production"></option>
                </select>
                <button class="button button--primary button--small button--icon"
                    @click="addEntry()">
                    <i class="fa fa-plus"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {

    inject: [
        'settings'
    ],

    data() {
        return {
            addKey: '',
            addSuffix: '',
        };
    },

    methods: {

        addEntry() {
            const key = this.addKey + this.addSuffix;
            this.settings.setValue(key, '');
            this.$nextTick(() => {
                const input = this.$refs.container.querySelector(`[data-entry-key="${key}"]`);
                if (input) {
                    input.focus();
                }
            });
        }

    }

};
</script>
