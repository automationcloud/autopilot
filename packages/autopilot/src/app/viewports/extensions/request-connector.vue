<template>
    <div class="request-connector">
        <i class="rc-icon fas fa-exclamation-circle"></i>
        <div class="rc-body">
            <div class="rc-title">
                API Connector not listed?
            </div>
            <div class="rc-message">
                If there's an API you need that's not listed here we can usually publish one. Gen in touch.
                <div class="rc-actions">
                    <button class="button button--cta rc-action"
                        @click="modals.show('request-connector')"
                        title="Request API Connector">
                        <span>Request API Connector</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    inject: [
        'modals'
    ],
};
</script>

<style scoped>
.request-connector {
    display: flex;
    flex-flow: row nowrap;
    margin-bottom: var(--gap);
    border-radius: var(--border-radius);
    background: var(--color-cool--700);
    color: #fff;
    font-family: var(--font-family--alt);
    font-size: var(--font-size--alt);
}

.rc-icon {
    flex: 0 0 auto;
    padding: var(--gap);
    line-height: var(--font-size--alt); /* Balances oneliner height */
    font-size: 16px;
}

.rc-body {
    flex: 1;
}

.rc-title {
    margin: var(--gap) 0;
}

.rc-message {
    display: flex;
    flex-flow: row nowrap;
    margin: var(--gap) 0;
    line-height: 1.25;
    /* font-weight: 300; */
    opacity: .8;
}

.rc-actions {
    align-self: flex-end;
    margin: var(--gap);
}

button.rc-action {
    font-family: var(--font-family--alt);
    color: inherit;
    background: var(--color-cool--800);
    border: 0;
}

</style>
