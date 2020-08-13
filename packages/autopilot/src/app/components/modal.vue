<template>
    <transition name="fade-scale">
        <div class="modal"
            v-if="shown"
            @keydown.esc="onClose">
            <div class="modal__overlay"
                @click="onClickOverlay">
            </div>
            <div class="modal__content">
                <slot/>
                <div class="modal__buttons">
                    <slot name="buttons"/>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {

    props: {
        shown: { type: Boolean, default: false },
        closeOnClickOverlay: { type: Boolean, default: true },
    },

    methods: {

        onClose() {
            this.$emit('close');
        },

        onClickOverlay() {
            if (this.closeOnClickOverlay) {
                this.onClose();
            }
        }

    }

};
</script>

<style scoped>
.modal {
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

.modal__overlay {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,.8);
}

.modal__content {
    position: relative;
    z-index: 2;

    padding: var(--gap) var(--gap--large);
    width: 480px;
    max-height: 80vh;
    overflow-y: auto;

    background: #fff;
    box-shadow: 0 3px 8px rgba(0,0,0,.25);
    border-radius: var(--border-radius);
}

.modal__content--wide {
    width: 75%;
}

.modal__buttons {
    padding-top: var(--gap);
    display: flex;
    justify-content: flex-end;
}
</style>
