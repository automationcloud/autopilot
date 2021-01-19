<template>
    <div class="modal">
        <div class="modal__header">
            Open
        </div>
        <div class="modal__body">
            <location
                :lastLocation="location"
                @update="setLocation" />

            <component :is="'open-' + location"
                :key="location"
                @hide="$emit('hide')"/>
        </div>
    </div>
</template>

<script>
import Location from './automation/location.vue';
import OpenFile from './automation/open-file.vue';
import OpenAc from './automation/open-ac.vue';

export default {
    inject: [
        'saveload',
    ],

    components: {
        Location,
        OpenFile,
        OpenAc,
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
