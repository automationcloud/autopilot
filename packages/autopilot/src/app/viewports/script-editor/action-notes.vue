<template>
    <article class="action-notes"
        v-html="notesHtml">
    </article>
</template>

<script>
import marked from 'marked';

export default {

    props: {
        action: { type: Object, required: true }
    },

    computed: {

        notesHtml() {
            return (this.action.notes || '').trim() ?
                marked(this.action.notes) : '';
        }

    }

};
</script>

<style>
</style>
