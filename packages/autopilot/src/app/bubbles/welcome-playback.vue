<template>
    <div class="bubble__content">
        <div class="bubble__title">
            The Play bar
        </div>
        <p class="bubble__message">
            Control and debug playback of your script in the browser.
        </p>
        <div class="playback-icons">
            <div class="playback-item">
                <span class="playback-item__icon">
                    <i class="fas fa-play"></i>
                </span>
                <span class="playback-item__name">Play</span>
            </div>
            <div class="playback-item">
                <span class="playback-item__icon">
                    <i class="fas fa-pause"></i>
                </span>
                <span>Pause</span>
            </div>

            <div class="playback-item">
                <span class="playback-item__icon">
                    <i class="fas fa-play"></i>
                    <i class="playback-subicon fas fa-map-marker-alt"></i>
                </span>
                <span>Play current Context</span>
            </div>

            <div class="playback-item">
                <span class="playback-item__icon">
                    <i class="fas fa-play"></i>
                    <span class="playback-subicon playback-subicon--text">1</span>
                </span>

                <span>Play Action</span>
            </div>

            <div class="playback-item">
                <span class="playback-item__icon">
                    <i class="fas fa-play"></i>
                    <i class="playback-subicon fas fa-circle"></i>
                </span>

                <span>Play Action &amp; stop</span>
            </div>

            <div class="playback-item">
                <span class="playback-item__icon">
                    <i class="fas fa-map-marker-alt"></i>
                </span>
                <span>Match Context</span>
            </div>
            <div class="playback-item">
                <span class="playback-item__icon">
                    <i class="fas fa-sync-alt"></i>
                </span>
                <span>Reset playback</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
};
</script>

<style scoped>
.playback-icons {
    display: grid;
    grid-template-rows: 1fr 1fr 1fr 1fr;
    grid-template-columns: auto auto;
    grid-auto-flow: column;
    column-gap: var(--gap);
    margin: var(--gap) 0;
    font-size: var(--font-size);
}

.playback-item {
    display: grid;
    grid-template-columns: 25px auto;
    justify-content: start;
    align-items: center;
    gap: var(--gap--small);
}

.playback-item__icon {
    display: flex;
    flex-flow: row nowrap;
    align-items: flex-start;
    justify-content: start;
    padding: var(--gap--small) 0;
    box-sizing: border-box;
    border-radius: 0;
    border: 0;
}

.playback-subicon {
    margin-left: 2px;
    font-size: 9px;
}

.playback-subicon--text {
    font-size: 9px;
    font-weight: 600;
}
</style>
