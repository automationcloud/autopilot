<template>
    <div class="modal">
        <div class="modal__header">
            Save as
        </div>
        <div class="modal__body">
            Location
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

            <component :is="'save-' + location"
                :key="location"
                @hide="$emit('hide')"/>
        </div>
    </div>
</template>

<script>
import SaveAc from './save-automation/save-ac.vue';
import SaveFile from './save-automation/save-file.vue';

export default {
    inject: [
        'saveload',
    ],

    components: {
        SaveAc,
        SaveFile,
    },

    data() {
        return {
            location: this.saveload.location || 'ac',
        };
    },

};
</script>
