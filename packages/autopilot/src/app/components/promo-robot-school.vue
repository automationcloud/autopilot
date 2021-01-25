<template>
    <div class="automation-cloud promo promo--blue">
        <img src="resources/ubio-humanoid-blue.svg" alt="robot">
        <article class="promo-content">
            <h2 class="promo-content-title">
                Learn how to script in Autopilot
            </h2>
            <p class="promo-content-p dark-blue">
                Get up to speed with Autopilot and create your first script.
                Robot School will tutor you.
                Beware: You may turn a little bit 'robot'.
            </p>
            <a class="button button--cta"
                :href="robotSchoolUrl">
                <span>Robot School</span>
            </a>
        </article>
    </div>
</template>

<script>
import { acUrls } from '../util';

export default {
    computed: {
        robotSchoolUrl() { return acUrls.get('robotSchool'); }
    },
};
</script>

<style scoped>
.promo {
    display: flex;
    align-items: flex-start;
    box-shadow: 0 4px 4px rgba(0,0,0,.25);
    border-radius: 4px;
}

.promo img {
    border-radius: inherit;
}

.promo-content {
    align-self: center;
    margin: var(--gap) var(--gap--large);
    padding: var(--gap) 0;
    font-size: var(--font-size);
}

.promo-content-title {
    margin: var(--gap--small) 0;;
    font-size: 1.8em;
    line-height: 30px;
}

.promo-content-p {
    font-size: 1.2em;
    color: #fff;
    margin: var(--gap) 0;
}

.promo-content .button {
    background: transparent;
    border-width: 0px;
    font-size: 1.5em;
    font-weight: 400;
    padding: 0px;
}

.promo-content .button::before {
    margin-left: 0;
}

.promo--blue {
    background: linear-gradient(152.25deg,#0873a1 27.31%,#31aade 94.18%);
}

.promo--blue .promo-content-title,
.promo--blue .button {
    color: var(--color-blue--400);
}
</style>
