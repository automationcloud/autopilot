<template>
    <div class="error">
        <a class="error__dismiss"
            v-if="allowDismiss"
            @click="$emit('dismiss')">
            <i class="fas fa-times-circle"></i>
        </a>
        <div class="error__line" v-for="e of errors">
            <div class="error__title">
                <template v-if="showErrorCode">
                    <span v-if="e.code || e.name"
                        class="error__code">
                        {{ e.code || e.name }}
                    </span>
                </template>
                <span class="error__message">{{ e.message }}</span>
                <a @click="showDetails = !showDetails"
                    v-if="Object.keys(e.details || {}).length"
                    class="error__expand">
                    <i class="fa" :class="{
                        'fa-caret-down': showDetails,
                        'fa-caret-right': !showDetails,
                    }"></i>
                </a>
            </div>
            <div class="error__details" v-if="showDetails">
                <explore :data="e.details">
                </explore>
            </div>
        </div>
    </div>
</template>

<script>
import Explore from './explore.vue';

export default {

    components: {
        Explore
    },

    props: {
        err: {},
        allowDismiss: { type: Boolean },
        showErrorCode: { type: Boolean },
    },

    data() {
        return {
            showDetails: false
        };
    },

    computed: {

        errors() {
            const err = this.err;
            if (!err) {
                return [];
            }
            if (Array.isArray(err)) {
                return err;
            }
            if (err.message) {
                return [err];
            }
            return Object.keys(err).map(key => {
                return err[key];
            });
        },

    }

};
</script>

<style>
.error {
    position: relative;
    background: var(--color-red--100);
    font-size: var(--font-size--small);
}

.error__dismiss {
    position: absolute;
    top: 0;
    right: 0;
    margin: 2px;
    padding: var(--gap--small);

    color: var(--color-red--500);;
}

.error__line {
    display: block;
}

.error__title {
    display: flex;
    align-items: center;
    padding: var(--gap--small);
}

.error__code {
    margin-right: var(--gap--small);
    padding: 2px 4px;

    background: var(--color-red--500);
    color: #fff;

    font-family: var(--font-family--mono);
    font-size: var(--font__size--mono);
}

.error__message {
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--color-red--500);
}

.error__expand {
    display: block;
    padding: 0 var(--gap--small);
    color: var(--color-warm--500);
}

.error__details {
    padding: 0 var(--gap--small) var(--gap--small) var(--gap);
}

.error__stack {
    font-size: 9px;
    word-break: break-all;
}
</style>
