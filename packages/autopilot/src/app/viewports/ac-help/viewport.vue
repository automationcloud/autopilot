<template>
    <div class="ac-help automation-cloud">
        <div class="ac-help-item">

            <article class="content">
                <div class="content-header">
                    <h2>Get Help</h2>
                </div>
                <p class="content-text">
                    Graduated from Robot School and still need help?
                    Start in the Automation Cloud forum.
                    Expert scripters and the Automation Cloud team monitor all issues and conversations there.
                </p>
                <button
                    class="button button--primary button--cta"
                    type="click"
                    @click="onLinkClick('comunity')">
                    <span>Community</span>
                </button>

                <div class="box box--primary">
                    <h2 style="margin-top: 0px; font-size: 20px;">Find out more about the Automation Cloud</h2>
                    <span
                        style="display: inline-flex; align-items: center; cursor: pointer;"
                        @click="onLinkClick('comunity')">
                        <i class="fas fa-angle-right"></i>
                        automationcloud.net
                    </span>
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
                <button
                    class="button button--primary button--cta"
                    type="click"
                    @click="onLinkClick('robotSchool')">
                    <span>Robot School</span>
                </button>
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

                <button
                    class="button button--primary button--cta"
                    type="click"
                    @click="onLinkClick('dashboard')">
                    {{ authorised ? 'Dashboard' : 'Sign in to your Dashboard' }}
                </button>
                <button
                    v-show="!authorised"
                    class="button button--tertiary button--cta"
                    type="click"
                    @click="onLinkClick('signup')">
                    Sign up and get started
                </button>
            </article>
        </div>

        <div class="ac-help-item tray-bg--transparent-light">
            <promo-robot-school/>
        </div>
    </div>
</template>

<script>
import PromoRobotSchool from '~/components/automationcloud/promo-robot-school.vue';
import { shell } from 'electron';
import {
    ApiLoginController
} from '~/controllers';

export default {
    components: {
        PromoRobotSchool,
    },

    data() {
        return {
            links: {
                comunity: '#',
                automationCloud: '#',
                robotSchool: 'https://robotschool.dev',
                dashboard: '#',
                singin: '#',
                signup: '#'
            }
        };
    },

    computed: {
        apiLogin() { return this.get(ApiLoginController); },
        authorised() { return this.apiLogin.authorised; },
    },

    methods: {
        onLinkClick(type) {
            const link = this.links[type];
            shell.openExternal(link);
        }
    }

};
</script>

<style scoped>
.ac-help {
    display: flex;
    flex-flow: column;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 400;
}

.ac-help-item {
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
