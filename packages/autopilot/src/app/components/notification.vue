<template>
    <div class="notification"
        :class="[
            'notification--' + notification.level,
            'notification--' + notification.style,
            isInline ? 'notification--inline' : undefined,
        ]">
        <i class="notification__icon"
            :class="notification.icon">
        </i>
        <div v-if="notification.canClose"
            class="notification__close"
            @click="close()">
            <i class="fas fa-times"></i>
        </div>
        <div class="notification__body">
            <div class="notification__title"
                v-if="notification.title">
                {{ notification.title }}
            </div>
            <div class="notification__message"
                v-if="notification.message"
                v-text="notification.message.trim()">
            </div>
            <div class="notification__actions"
                v-if="hasActions">
                <button v-if="notification.primaryAction"
                    class="button button--cta notification__action notification__action--primary"
                    @click="notification.primaryAction.action()"
                    :title="notification.primaryAction.title">
                    <span>{{ notification.primaryAction.title }}</span>
                </button>
                <button v-if="notification.secondaryAction"
                    class="button button--cta notification__action notification__action--secondary"
                    @click="notification.secondaryAction.action()"
                    :title="notification.secondaryAction.title">
                    <span>{{ notification.secondaryAction.title }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {

    inject: [
        'notifications',
    ],

    props: {
        notification: { type: Object, required: true },
    },

    computed: {

        isInline() {
            return !this.notification.message &&
                this.notification.primaryAction &&
                !this.notification.secondaryAction;
        },

        hasActions() {
            return this.notification.primaryAction || this.notification.secondaryAction;
        },

    },

    methods: {

        close() {
            this.notifications.removeById(this.notification.id);
        }

    }

};
</script>

<style scoped>
.notification {
    position: relative;
    display: flex;
    flex-flow: row nowrap;

    border-radius: var(--border-radius);
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.25);

    font-family: var(--font-family--alt);
    font-size: var(--font-size--alt);
}

.notification + .notification {
    margin-top: var(--gap);
}

.notification--info {
    background: var(--color-cool--700);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.5);

    --primary-action-bg: var(--color-cool--800)
}

.notification--warn {
    background: var(--color-yellow--300);
    box-shadow: 0 1px 3px rgba(0,0,0,.2);

    --primary-action-bg: var(--color-yellow--400)
}

.notification--error {
    background: var(--color-red--200);
    color: var(--color-red--700);
    box-shadow: 0 1px 3px rgba(0,0,0,.2);

    --primary-action-bg: var(--color-red--300);
}

.notification--fatal {
    background: var(--color-red--700);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.5);

    --primary-action-bg: var(--color-red--800);
}

.notification--float {
    width: 60%;
}

@media (max-width: 480px) {
    .notification--float {
        width: 80%;
    }
}

.notification__icon {
    flex: 0 0 auto;
    padding: var(--gap);
    font-size: 16px;
    line-height: var(--font-size--alt); /* Balances oneliner height */
}

.notification__close {
    order: 3;
    padding: var(--gap);
    cursor: pointer;
    align-self: flex-start;
}

.notification__body {
    flex: 1;
}

.notification__title {
    margin: var(--gap) 0;
}

.notification__message {
    margin: var(--gap) 0;
    font-size: .85em;
    line-height: 1.25;
    /* font-weight: 300; */
    opacity: .8;
    white-space: pre-wrap;
}

.notification__actions {
    margin: var(--gap) 0;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
}

button.notification__action + button.notification__action {
    margin-left: var(--gap--small);
}

button.notification__action--primary {
    color: inherit;
    background: var(--primary-action-bg);
    border: 0;
    font-family: var(--font-family--alt);
}

button.notification__action--secondary {
    color: inherit;
    background: none;
    border: 0;
    font-family: var(--font-family--alt);
}

.notification--inline >>> .notification__body {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
}

.notification--inline >>> .notification__title {
    flex: 1;
    margin: 0;
}

.notification--inline >>> .notification__actions {
    margin: 0 4px;
}
</style>
