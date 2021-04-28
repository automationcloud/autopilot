<template>
    <div class="modal">
        <div class="modal__header">
            <span>Request an API Connector</span>
        </div>
        <div class="modal__body">
            <div v-if="sent"
                class="section">
                <h1 class="section__title">Thanks</h1>
                <p class="section-content">
                    We've received your request. We can't guarantee timeframes for creating new API connectors but we'll do our best with your request.</p>
            </div>
            <template v-else>
                <div class="form-row">
                    <div class="form-row__label">
                        Name
                    </div>
                    <div class="form-row__controls">
                        <input
                            class="input stretch"
                            placeholder="Your name"
                            v-model.trim="name"/>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-row__label">
                        Email
                    </div>
                    <div class="form-row__controls">
                        <input
                            class="input stretch"
                            type="email"
                            placeholder="you@email.com"
                            v-model.trim="email"/>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-row__label"
                        style="align-self: flex-start; margin-top: var(--gap);">
                        Request details
                    </div>
                    <div class="form-row__controls">
                        <textarea class="textarea"
                            placeholder="Please be as detailed as possible."
                            v-model.trim="details"
                            rows="6">
                        </textarea>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-row__label">
                        API spec link
                    </div>
                    <div class="form-row__controls">
                        <input
                            class="input stretch"
                            type="url"
                            placeholder="https://..."
                            v-model.trim="url"/>
                        <span class="url-hint">
                            <i class="fas fa-info-circle" style="margin-top: 2px;"></i>
                            Please provide a link to the Open API/Swagger spec for the API you're interested in.
                        </span>
                    </div>
                </div>
            </template>

        </div>


        <div class="modal__buttons">
            <button class="button button--alt button--tertiary"
                @click="$emit('hide')">
                {{ sent ? 'Close' : 'Cancel' }}
            </button>
            <button v-if="!sent"
                class="button button--alt button--primary"
                @click="send()"
                :disabled="!canRequest">
                Request
            </button>
        </div>

    </div>
</template>

<script>

export default {

    inject: [
        'helpdesk',
    ],

    data() {
        return {
            name: '',
            email: '',
            details: '',
            url: '',

            loading: false,
            sent: false,
        };
    },

    computed: {
        canRequest() {
            return this.name && this.email && this.details && !this.loading;
        },

    },

    methods: {
        async send() {
            if (!this.canRequest) {
                return;
            }
            try {
                this.loading = true;
                await this.helpdesk.createConnectorTicket({
                    name: this.name,
                    email: this.email,
                    details: this.details,
                    url: this.url,
                });
                this.sent = true;
            } finally {
                this.loading = false;
            }
        },
    }

};
</script>

<style scope>
.url-hint {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 var(--gap--small);
    margin: var(--gap) 0;
    font-style: italic;
    font-family: var(--font-family--alt);
    font-size: var(--font-size--small);
    line-height: 1.5em;
    color: var(--color-cool--600);
}
</style>
