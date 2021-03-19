<template>
    <div class="bubble"
        :class="[
            'arrow--direction-' + bubble.arrow.direction,
            'arrow--align-' + bubble.arrow.align,
        ]">
        <i class="bubble__icon"></i>
        <div class="bubble__close"
            @click="welcome.close()">
            <i class="fas fa-times"></i>
        </div>
        <div class="bubble__body">
            <div class="bubble__title">
                {{ bubble.title }}
            </div>
            <p class="bubble__message"
                v-if="bubble.message"
                v-text="bubble.message.join('\n')">
            </p>
            <div class="bubble__actions group group--gap--small">
                <span v-text="`${index + 1}/${totalStep}`"></span>
                <button class="button button--cta bubble__button"
                    @click="welcome.next()"
                    :title="actionTitle">
                    <span>{{ actionTitle }}</span>
                </button>
            </div>
        </div>
    </div>
    </div>
</template>

<script>
export default {

    inject: [
        'welcome',
    ],

    props: {
        bubble: { type: Object, required: true },
        index: { type: Number, required: true },
    },

    computed: {
        totalStep() { return this.welcome.contents.length; },
        actionTitle() { return this.index + 1 === this.totalStep ? 'Finish' : 'Next' },
    },

};
</script>

<style scoped>
.bubble {
    position: absolute;
    display: flex;
    flex-flow: row nowrap;
    z-index: 100;
    bottom: var(--playback-panel-size);
    color: var(--ui-color--black);
    width: 300px;
    height: fit-content;

    border-radius: var(--border-radius);
    background: var(--color-yellow--300);
    box-shadow: 0 1px 3px rgba(0,0,0,.2);

    font-family: var(--font-family--alt);
    font-size: var(--font-size--alt);
    --primary-action-bg: var(--color-yellow--400);
}

.arrow--direction-top {
    top: 50px;
}

.bubble--float {
    width: 60%;
}

@media (max-width: 480px) {
    .bubble--float {
        width: 80%;
    }
}

.bubble__icon {
    flex: 0 0 auto;
    padding: var(--gap);
    font-size: 16px;
    line-height: var(--font-size--alt); /* Balances oneliner height */
}

.bubble__close {
    order: 3;
    padding: var(--gap);
    cursor: pointer;
    align-self: flex-start;
}

.bubble__body {
    flex: 1;
}

.bubble__title {
    margin: var(--gap) 0;
}

.bubble__message {
    margin: var(--gap) 0;
    font-size: .85em;
    line-height: 1.25;
    /* font-weight: 300; */
    opacity: .8;
    white-space: pre-wrap;
}

.bubble__actions {
    margin: var(--gap) 0;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
}

button.bubble__button {
    color: inherit;
    background: var(--primary-action-bg);
    border: 0;
    font-family: var(--font-family--alt);
}

</style>
