<template>
    <div class="connector-request">
        <i class="req__icon fas fa-exclamation-circle"></i>
        <div class="req__body">
            <div class="req__title">
                API Connector not listed?
            </div>
            <div class="req__message">
                If the service you need offers an OpenAPI/Swagger spec API we can publish one. Gen in touch.
                <div class="req__actions">
                    <button class="button button--cta req__action"
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
.connector-request {
    display: flex;
    flex-flow: row nowrap;
    margin-bottom: var(--gap);
    border-radius: var(--border-radius);
    background: var(--color-cool--700);
    color: #fff;
    font-family: var(--font-family--alt);
    font-size: var(--font-size--alt);
}

.req__icon {
    flex: 0 0 auto;
    padding: var(--gap);
    font-size: 16px;
    line-height: var(--font-size--alt); /* Balances oneliner height */
}

.req__body {
    flex: 1;
}

.req__title {
    margin: var(--gap) 0;
}

.req__message {
    display: flex;
    flex-flow: row nowrap;
    margin: var(--gap) 0;
    line-height: 1.25;
    /* font-weight: 300; */
    opacity: .8;
}

.req__actions {
    margin: var(--gap);
    align-self: flex-end;
}

button.req__action {
    font-family: var(--font-family--alt);
    color: inherit;
    background: var(--color-cool--800);
    border: 0;
}

</style>
