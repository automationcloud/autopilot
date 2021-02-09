<template>
    <div class="notification"
        :class="[
            'notification--' + notification.style,
            'notification--' + notification.level,
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
        </div>
        <!-- TODO add actions, implement inline stuff -->
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

    methods: {

        close() {
            this.notifications.removeById(this.notification.id);
        }

    }

};
</script>
