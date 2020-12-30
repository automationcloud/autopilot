<template>
    <transition name="fade-scale">
        <div class="modals"
            v-if="modals.currentModalName"
            @keydown.esc="modals.hide()">
            <div class="modals__overlay"
                @click="modals.hide()">
            </div>
            <div class="modals__container">
                <component :is="'modal-' + modals.currentModalName"
                    @hide="modals.hide()"/>
                <span class="modals__hide"
                    @click="modals.hide()">
                    <i class="fa fa-times"></i>
                </span>
            </div>
        </div>
    </transition>
</template>

<script>
// https://webpack.js.org/guides/dependency-management/#requirecontext
const ctx = require.context('../modals', true, /\.vue$/);
const modalComponents = {};
for (const key of ctx.keys()) {
    const name = 'modal-' + key.replace(/\.vue$/, '').replace(/[^a-z0-9_-]/gi, '');
    const component = ctx(key).default;
    modalComponents[name] = component;
}

export default {

    inject: [
        'modals',
    ],

    components: {
        ...modalComponents
    },
};
</script>

<style scoped>
.modals {
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
}

.modals__overlay {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,.8);
}

.modals__container {
    position: relative;
    z-index: 2;
}

.modals__hide {
    position: absolute;
    top: var(--gap);
    right: var(--gap);
    color: #fff;
    cursor: pointer;
}
</style>
