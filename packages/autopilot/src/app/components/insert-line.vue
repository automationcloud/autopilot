<template>
    <div class="insert-line"
        v-on="listeners"
        :title="title"
        :tabindex="tabindex">
        <i class="fas fa-plus insert-line__icon">
        </i>
    </div>
</template>

<script>
export default {

    components: {

    },

    props: {
        title: { type: String },
        tabindex: { type: String }
    },

    computed: {

        listeners() {
            return {
                ...this.$listeners
            };
        }

    },

    methods: {

    }

};
</script>

<style>
.insert-line {
    position: relative;
    z-index: 10;
    cursor: pointer;

    --insert-line-color: var(--color-cool--300);
}

.insert-line::after {
    content: '';
    position: absolute;
    background: var(--insert-line-color);
    left: 0;
    right: 0;
    top: 50%;
    height: 4px;
    margin-top: -2px;
    border-radius: var(--border-radius);
}

.insert-line__icon {
    position: absolute;
    z-index: 2;
    left: 0;
    top: 50%;
    width: 16px;
    height: 16px;
    margin-top: -8px;
    line-height: 16px;
    font-size: var(--font-size--small);
    text-align: center;
    vertical-align: middle;
    border-radius: 100%;
    background: var(--insert-line-color);
    color: #fff;
}

.insert-line--padding {
    height: 8px;
}

.insert-line--hover {
    opacity: 0;
}

.insert-line--hover:hover, .insert-line--selected, .insert-line--shown {
    opacity: 1;
}

.insert-line--selected, .insert-line--hover:hover, .insert-line:focus {
    --insert-line-color: var(--border-color--focus);
}

.insert-line:focus {
    outline: 0;
}
</style>
