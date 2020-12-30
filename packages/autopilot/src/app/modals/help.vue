<template>
    <div class="modal" v-if="helpItem">
        <div class="modal__header">
            <i class="far fa-question-circle">
            </i>
            {{ helpItem.label }}
        </div>
        <div class="modal__body">
            <article v-html="helpItem.help">
            </article>
        </div>
    </div>
</template>

<script>
export default {

    inject: [
        'help'
    ],

    computed: {
        helpItem() {
            return this.help.helpItem;
        },
    },

};
</script>

<style scoped>
.modal {
    padding: 0;
    max-width: 450px;
}

.modal-help >>> .modal__buttons {
    padding: 0;
}

.modal-help >>> .help-header  {
    padding-left: var(--gap);
}

.modal-help >>> .help-content {
    padding-left: var(--gap--large);
}

.help {
    flex: 1 1 auto;
    display: flex;
    flex-flow: column nowrap;
    min-width: 350px;
    max-width: 450px;
    max-height: 100%;
    background: var(--color-cool--100);
}

.help-header {
    flex: 0 0 auto;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    background: var(--color-blue--600);
    color: #fff;
}

.help-content {
    flex: 1;
    padding: var(--gap);
    overflow-y: auto;
}

/*
DOM content created with v-html are not affected by scoped styles,
but you can still style them using deep selectors.
https://vue-loader.vuejs.org/guide/scoped-css.html#deep-selectors
*/

.help-header-icon {
    margin-right: var(--gap--small);
}

.help-header-label {
    padding: var(--gap);
}

.help-header-close {
    padding: var(--gap);
}

.help-header-close:hover {
    cursor: pointer;
}
</style>
