<template>
    <div class="err"
        :class="{ 'err--expanded': expanded }"
        @click="expanded = !expanded">
        <div class="err__header">
            <div class="err__message">
                {{ err.message }}
            </div>
        </div>
    </div>
</template>

<script>
export default {

    props: {
        err: { required: true }
    },

    data() {
        return {
            expanded: false
        };
    }

};
</script>

<style>
.err__header {
    display: flex;
    flex-flow: row nowrap;
    align-items: baseline;
}

.err__message {
    flex: 1;
    min-width: 0;

    color: var(--color-red--500);
}
</style>
