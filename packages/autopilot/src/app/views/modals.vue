<template>
    <div>
        <modal-menu/>
        <modal-help/>
    </div>
</template>

<script>
import ModalMenu from './modal-menu.vue';
import ModalHelp from './modal-help.vue';

export default {
    components: {
        ModalMenu,
        ModalHelp,
    },
};
</script>
