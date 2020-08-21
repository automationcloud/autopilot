<template>
    <modal class="modal-help"
        :shown="shown"
        @close="onClose">
        <help
            :helpItem="helpItem"
            @close="onClose"/>
    </modal>

</template>

<script>
export default {

    computed: {
        shown() {
            return this.app.ui.help.modalShown();
        },

        helpItem() {
            return this.app.ui.help.helpItem;
        },
    },

    methods: {
        onClose() {
            this.app.ui.help.hideModal();
        }
    },

};
</script>

<style scoped>
.modal-help >>> .modal__content {
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

</style>
