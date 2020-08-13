<template>
    <div class="pipeline-input">
        <elem
            :key="i"
            v-for="(el, i) of inputSet"
            :el="el"/>
        <div class="arrow pipeline-input__arrow"
            v-if="inputSet.length">
        </div>
        <div class="pipeline-input__empty"
            v-if="!inputSet.length">
            No elements in scope
        </div>
    </div>
</template>

<script>
import Elem from './elem.vue';

export default {

    components: {
        Elem
    },

    props: {
        inputSet: { type: Array }
    }

};
</script>

<style>
.pipeline-input {
    position: relative;
    padding: var(--gap);
    background: var(--color-mono--300);
}

.pipeline-input__arrow.arrow {
    --arrow-color: var(--color-mono--300);
}

.pipeline-input__empty {
    color: var(--color-red--500);
}
</style>
