<template>
    <div class="help-resources automation-cloud">
        <div class="help-resources-item">

            <article class="content">
                <div class="content-header">
                    <h2>Get Help</h2>
                </div>
                <p class="content-text">
                    Graduated from Robot School and still need help?
                    Start in the Automation Cloud forum.
                    Expert scripters and the Automation Cloud team monitor all issues and conversations there.
                </p>
                <a :href="communityUrl"
                    class="button button--primary button--cta">
                    Community
                </a>

                <div class="box box--primary">
                    <h2 style="margin-top: 0px; font-size: 20px;">Find out more about the Automation Cloud</h2>
                    <a
                        class="button button--tertiary button--cta"
                        style="padding-left: 0px;"
                        :href="homeUrl">
                        automationcloud.net
                    </a>
                </div>
            </article>

            <article class="content">
                <div class="content-header">
                    <h2>Tutorials &amp; API Reference </h2>
                    <img src="resources/product-logos/robot-school.svg" class="content-image">
                </div>
                <p class="content-text">
                    Learn the fundamentals of scripting in Autopilot by following our guided tutorials.
                    Access reference documentation about the Autopilot tool and the Automation Cloud API.
                </p>
                <a
                    class="button button--primary button--cta"
                    type="click"
                    :href="robotSchoolUrl">
                    <span>Robot School</span>
                </a>
            </article>

            <hr class="content">

            <article class="content">
                <div class="content-header">
                    <h2>Monitor your Automations</h2>
                    <img src="resources/product-logos/dashboard.svg" class="content-image">
                </div>

                <p class="content-text">
                    Dashboard is the nerve centre for managing, observing and monitoring the authomations you run in the Automation Cloud.
                    Watch jobs while they execute and drill down into the low-level detail.
                </p>

                <a
                    class="button button--primary button--cta"
                    type="click"
                    :href="dashboardUrl">
                    {{ isAuthenticated ? 'Dashboard' : 'Sign in to your Dashboard' }}
                </a>
                <a
                    v-show="!isAuthenticated"
                    class="button button--tertiary button--cta"
                    :href="registerUrl">
                    Sign up and get started
                </a>
            </article>
        </div>

        <div class="help-resources-item tray-bg--transparent-light">
            <promo-robot-school/>
        </div>
    </div>
</template>

<script>
import { acUrls } from '../../util';

export default {

    inject: [
        'apiLogin',
    ],

    computed: {
        isAuthenticated() { return this.apiLogin.isAuthenticated(); },
        communityUrl() { return acUrls.get('community'); },
        robotSchoolUrl() { return acUrls.get('robotSchool'); },
        homeUrl() { return acUrls.get('home'); },
        registerUrl() { return acUrls.get('register'); },
        dashboardUrl() { return acUrls.get('dashboard'); },
    },

};
</script>

<style scoped>
.help-resources {
    display: flex;
    flex-flow: column;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 400;
}

.help-resources-item {
    padding: var(--gap) var(--gap--large);
}

.content {
    margin-bottom: var(--gap--large);
}

.content > * {
    margin-bottom: var(--gap--large);
}

.content-header {
    display: flex;
    justify-content: space-between;
}

.content-image {
    width: 110px;
    margin-left: var(--gap);
}

.content-text {
    max-width: 650px;
}

</style>
