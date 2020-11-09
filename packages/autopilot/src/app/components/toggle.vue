<template>
    <label class="toggl"
        :class="{
            'toggl--on': value,
            'toggl--off': !value,
        }">
        <input
            class="toggl__input"
            type="checkbox"
            :checked="value"
            @change="onChange" />
        <div class="toggl__slider">
        </div>
    </label>
</template>

<script>
export default {
    props: {
        value: { type: Boolean, required: false },
    },

    methods: {
        onChange(ev) {
            this.$emit('input', ev.target.checked);
        }
    }
};
</script>

<style scoped>
.toggl {
    --toggl-width: 44px;
    --toggl-height: 20px;
    --toggl-padding: 2px;
    --toggl-size: calc(var(--toggl-height) - 2 * var(--toggl-padding));

    position: relative;
    display: inline-block;
    padding: var(--toggl-padding);
    width: var(--toggl-width);
    height: var(--toggl-height);
    border-radius: var(--toggl-size);

    cursor: pointer;
    transition: background-color .3s;
}

.toggl::after {
    content: '';
    display: inline-block;
    position: absolute;
    z-index: 1;
    top: 0;
    bottom: 0;
    line-height: var(--toggl-height);
    text-transform: uppercase;
    font-size: var(--font-size--small);
    width: calc(var(--toggl-width) - var(--toggl-size));
    text-align: center;
}

.toggl--off {
    background: var(--color-mono--200);
}

.toggl--off::after {
    content: 'off';
    right: 0;
}

.toggl--on {
    background: var(--color-blue--500);
}

.toggl--on::after {
    content: 'on';
    color: #fff;
    left: 0;
}

.toggl__input {
    display: none;
}

.toggl__slider {
    position: absolute;
    z-index: 10;
    width: var(--toggl-size);
    height: var(--toggl-size);
    border-radius: 100%;
    background: #fff;
    transition: transform .3s;
}

.toggl--on .toggl__slider {
    --toggl-end-pos: calc(
        var(--toggl-width) -
        var(--toggl-size) -
        2 * var(--toggl-padding)
    );
    transform: translateX(var(--toggl-end-pos));
}

</style>
