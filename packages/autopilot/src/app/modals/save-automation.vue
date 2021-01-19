<template>
    <div class="modal">
        <div class="modal__header">
            Save as
        </div>
        <div class="modal__body">
            <location
                :lastLocation="location"
                @update="setLocation" />

            <component :is="'save-' + location"
                :key="location"
                @hide="$emit('hide')"/>
        </div>
    </div>
</template>

<script>
import Location from './automation/location.vue';
import SaveAc from './automation/save-ac.vue';
import SaveFile from './automation/save-file.vue';

export default {
    inject: [
        'saveload',
    ],

    components: {
        Location,
        SaveAc,
        SaveFile,
    },

    data() {
        return {
            location: this.saveload.location || 'ac',
        };
    },

    methods: {
        setLocation(val) {
            if (val === 'file' || val === 'ac') {
                this.location = val;
            }
        }
    },
};
</script>
