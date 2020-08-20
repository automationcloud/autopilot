<template>
    <div class="help" v-if="helpItem">
        <div class="help-header group group--separated">
            <div class="help-header-label">
                <i class="help-header-icon far fa-question-circle">
                </i>
                {{ helpItem.label }}
            </div>
            <div class="help-header-close"
                @click="$emit('close')">
                <i class="fas fa-times"></i>
            </div>
        </div>

        <article class="help-content"
            v-html="helpItem.help">
        </article>

    </div>
</template>

<script>
export default {
    props: {
        helpItem: { type: Object } // { label: string, help: string }
    }
};
</script>

<style scoped>
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
.help-content >>> h3 {
    color: var(--color-blue--600);
    font-weight: 400;
    font-size: var(--font-size);
    text-transform: uppercase;
    margin-top: var(--gap--large);
}

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