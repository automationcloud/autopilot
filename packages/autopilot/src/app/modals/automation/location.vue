<template>
    <div>
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
    </div>
</template>

<script>
export default {
    props: {
        lastLocation: { type: String, default: 'ac' }
    },

    data() {
        return {
            location: this.lastLocation,
        };
    },

    watch: {
        location: function(newLocation) {
            this.$emit('update', newLocation);
        }
    }
};
</script>
