<template>
    <div class="welcome">
        <bubble selector="[data-anchor='viewport-scriptEditor-w']"
            orientation="left"
            alignment="end">
            <p>Some content</p>
        </bubble>
    </div>
</template>

<style scoped>
.welcome {
    position: fixed;
    z-index: 1000;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    pointer-events: none;
}
</style>
