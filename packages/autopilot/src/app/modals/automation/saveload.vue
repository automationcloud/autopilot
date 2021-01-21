<template>
    <div class="modal">
        <div class="modal__header font-family--alt">
            <slot name="title"></slot>
        </div>
        <div class="modal__body">
            <div>
                <div class="saveload-location">Location</div>
                <div class="form-row">
                    <div class="form-row__controls">
                        <input class="input"
                            type="radio"
                            id="location-ac"
                            v-model="location"
                            value="ac"/>

                        <label class="form-row__label"
                            for="location-ac">
                            Automation Cloud
                        </label>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-row__controls">
                        <input class="input"
                            type="radio"
                            id="location-file"
                            v-model="location"
                            value="file"/>
                        <label class="form-row__label"
                            for="location-file">
                            Your computer
                        </label>
                    </div>
                </div>
            </div>
            <slot name="main" v-bind:location="location"></slot>
        </div>

        <div class="modal__actions automation-cloud" style="">
            <button class="button button--tertiary"
                @click="$emit('hide')">
                Cancel
            </button>
            <slot name="action" v-bind:location="location"></slot>
        </div>
    </div>
</template>

<script>
export default {
    inject: [
        'saveload',
    ],

    data() {
        return {
            location: this.saveload.location || 'ac',
        };
    },
};
</script>

<style scoped>
.saveload-location {
    font-family: var(--font-family--alt);
    font-size: 1.6em;
    margin-bottom: var(--gap--large);
}

.modal__actions {
    background: var(--color-cool--100);
    padding: var(--gap) 0;
    display: flex;
    justify-content: flex-end;
}

.modal__actions .button {
    font-weight: 500;
    font-size: 1.4em;
}
</style>
