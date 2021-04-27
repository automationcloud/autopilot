<template>
    <div class="modal">
        <div class="modal__header">
            <span>Request an API Connector</span>
        </div>
        <div class="modal__body">
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
                        v-model.trim="link"/>
                    <span class="info">
                        <i class="fas fa-info-circle" style="margin-top: 2px;"></i>
                        Please provide a link to the Open API/Swagger spec for the API you're interested in.
                    </span>
                </div>
            </div>

        </div>

        <div v-if="errorShown">
            Failed to send your request, Please try again.
        </div>

        <div class="modal__buttons">
            <button class="button button--alt button--tertiary"
                @click="$emit('close')">
                Cancel
            </button>
            <button class="button button--alt button--primary"
                @click="request()"
                :disabled="!canRequest">
                Request
            </button>
        </div>

    </div>
</template>

<script>

export default {

    inject: [
        'api'
    ],

    data() {
        return {
            name: '',
            email: '',
            details: '',
            link: '',

            errorShown: false,
            loading: false,
        };
    },

    computed: {
        canRequest() {
            return this.name && this.email && this.details && this.link && !this.loading;
        },

    },

    methods: {
        async request() {
            this.loading = true;
            try {
                await this.api.createHelpTicket({
                    subject: 'Request for a new API connector',
                    email: this.email,
                    name: this.name,
                    text: [
                        `${this.details}`,
                        `OpenAPI/Swagger URL: ${this.link}`,
                        '** Ticket created from Autopilot **'
                    ].join('\n\n'),
                });
            } catch (error) {
                console.error('failed to create a help ticket', error);
                this.errorShown = true;
            } finally {
                this.loading = false;
            }
        }
    }

};
</script>

<style scope>
.info {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 var(--gap--small);
    font-style: italic;
    font-family: var(--font-family--alt);
    font-size: var(--font-size--small);
    line-height: 1.5em;
    color: var(--color-cool--600);
    margin: var(--gap) 0;
}
</style>
