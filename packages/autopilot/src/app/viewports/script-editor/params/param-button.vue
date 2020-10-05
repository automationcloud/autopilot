<template>
    <div class="param--button">

        <label class="param__field">
            <button class="button button--primary"
                @click="run()">
                <template v-if="running">
                    <i class="fas fa-spinner fa-spin"></i>
                </template>
                <template v-else>
                {{ label }}
                </template>
            </button>
        </label>

    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin],

    data() {
        return {
            running: false,
        };
    },

    methods: {

        async run() {
            if (this.running) {
                return;
            }
            try {
                this.running = true;
                await this.item[this.param.name](this.inputSet);
            } catch (err) {
                alert(err.message);
            } finally {
                this.running = false;
            }
        }

    }

};
</script>

<style scoped>
</style>
