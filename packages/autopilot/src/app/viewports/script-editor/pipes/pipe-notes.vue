<template>
    <article class="pipe-notes"
        v-html="notesHtml">
    </article>
</template>

<script>
import marked from 'marked';

export default {

    props: {
        pipe: { type: Object, required: true }
    },

    computed: {

        notesHtml() {
            return (this.pipe.notes || '').trim() ?
                marked(this.pipe.notes) : '';
        }

    }

};
</script>

<style>
.pipe-notes {
    padding: 0 var(--gap);
}
</style>
