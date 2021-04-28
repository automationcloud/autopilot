<template>
    <div class="request-connector">
        <i class="rc__icon fas fa-exclamation-circle"></i>
        <div class="rc__body">
            <div class="rc__title">
                API Connector not listed?
            </div>
            <div class="rc__message">
                If the service you need offers an OpenAPI/Swagger spec API we can publish one. Gen in touch.
                <div class="rc__actions">
                    <button class="button button--cta rc__action"
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

.rc__icon {
    flex: 0 0 auto;
    padding: var(--gap);
    line-height: var(--font-size--alt); /* Balances oneliner height */
    font-size: 16px;
}

.rc__body {
    flex: 1;
}

.rc__title {
    margin: var(--gap) 0;
}

.rc__message {
    display: flex;
    flex-flow: row nowrap;
    margin: var(--gap) 0;
    line-height: 1.25;
    /* font-weight: 300; */
    opacity: .8;
}

.rc__actions {
    align-self: flex-end;
    margin: var(--gap);
}

button.rc__action {
    font-family: var(--font-family--alt);
    color: inherit;
    background: var(--color-cool--800);
    border: 0;
}

</style>
