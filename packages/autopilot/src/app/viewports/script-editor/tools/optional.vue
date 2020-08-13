<template>
    <div class="optional">

        <div class="form-row">
            <div class="form-row__label">
                Optional
            </div>
            <div class="form-row__controls">
                <input type="checkbox"
                    v-model="actionProxy.optional"/>
            </div>
        </div>

    </div>
</template>

<script>
export default {

    props: {
        actionProxy: { type: Object, required: true }
    }

};
</script>
