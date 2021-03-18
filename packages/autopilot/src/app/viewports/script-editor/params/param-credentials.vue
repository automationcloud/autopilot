<template>
    <div class="param--credentials">

        <div class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls login-details">
                <button v-if="!value"
                    @click="credentials.login(item, param)"
                    class="button button--primary">
                    <i v-if="param.icon"
                        class="button__icon"
                        :class="param.icon"></i>
                    <span>Log into {{ param.providerName }}</span>
                </button>
            </div>
        </div>
        {{ value }}
    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    inject: [
        'credentials'
    ],

    mixins: [ParamMixin],

    computed: {

    }

};
</script>

<style scoped>
.login-details {
    text-align: right;
}
</style>
