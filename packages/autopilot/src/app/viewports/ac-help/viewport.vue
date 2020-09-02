<template>
    <div class="ac-help automation-cloud">
        <div>
            <article class="content">
                <div class="content-header">
                    <h2>Get Help</h2>
                </div>
                <p>Graduated from Robot School and still need help? Start in the Automation Cloud forum. Expert scripters and the Automation Cloud team monitor all issues and conversations there.</p>
                <button
                    class="button button--yellow"
                    type="click"
                    @click="onLinkClick('comunity')">
                    <i class="fas fa-angle-right button__icon"></i>
                    <span>Community</span>
                </button>

                <div class="box box--yellow">
                    <h2>Find out more about the Automation Cloud</h2>
                    <span
                        style="display: inline-flex; align-items: center; cursor: pointer;"
                        @click="onLinkClick('comunity')">
                        <i class="fas fa-angle-right button__icon"></i>
                        automationcloud.net
                    </span>
                </div>
            </article>

            <article class="content">
                <div class="content-header">
                    <h2>Tutorials &amp; API Reference </h2>
                    <img src="resources/product-logos/robot-school.svg" class="content-image">
                </div>
                <p>Learn the fundamentals of scripting in Autopilot by following our guided tutorials. Access reference documentation about the Autopilot tool and the Automation Cloud API.</p>
                <button
                    class="button button--yellow"
                    type="click"
                    @click="onLinkClick('robot-school')">
                    <i class="fas fa-angle-right button__icon"></i>
                    <span>Robot School</span>
                </button>
            </article>

            <hr>
            <article class="content">
                <div class="content-header">
                    <h2>Monitor your Automations</h2>
                    <img src="resources/product-logos/dashboard.svg" class="content-image">
                </div>
                <p>Graduated from Robot School and still need help? Start in the Automation Cloud forum. Expert scripters and the Automation Cloud team monitor all issues and conversations there.</p>
                <button
                    class="button button--yellow"
                    type="click"
                    @click="onLinkClick('dashboard')">
                    <i class="fas fa-angle-right button__icon"></i>
                    <span>Dashboard</span>
                </button>
            </article>
        </div>

        <template>
            <div class="card-item">
                <img src="resources/ubio-humanoid-blue.svg" alt="robot">
                <article class="card-content">
                    <h2 class="card-content-title">Learn how to script in Autopilot</h2>
                    <p class="card-content-p dark-blue">
                        Get up to speed with Autopilot and create your first script.
                        Robot School will tutor you. Beware: You may turn a little bit 'robot'.
                    </p>
                    <button class="button">
                        <i class="fas fa-angle-right button__icon"></i>
                        <span>Robot School</span>
                    </button>
                </article>
            </div>
        </template>
    </div>
</template>

<script>
import { shell } from 'electron';
import {
    ApiLoginController
} from '~/controllers';

export default {
    data() {
        return {
            links: {
                comunity: '#',
                automationCloud: '#',
                robotSchool: '#',
                dashboard: '#',
            }
        };
    },

    computed: {

        apiLogin() {
            return this.get(ApiLoginController);
        },

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
    padding: var(--gap) var(--gap--large);
    font-size: var(--font-size);
    font-weight: 400;
}

.content {
    margin-bottom: var(--gap--large);
    max-width: 650px;
}

.content > * {
    margin: var(--gap) 0;
}

.content-header {
    display: flex;
    justify-content: space-between;
}

.content-image {
    width: 110px;
    margin-left: var(--gap);
}

.card-item {
    display: flex;
    align-items: flex-start;
    background: linear-gradient(152.25deg,#0873a1 27.31%,#31aade 94.18%);
    box-shadow: 0 4px 4px rgba(0,0,0,.25);
    border-radius: 4px;
    margin: var(--gap) 0;
}

.card-item img {
    border-radius: inherit;
}

.card-content {
    align-self: center;
    margin: var(--gap) var(--gap--large);
    padding: var(--gap) 0;
    font-size: var(--font-size);
}


.card-content-title {
    margin: var(--gap--small) 0;;
    font-size: 1.8em;
    line-height: 30px;
    color: var(--color-blue--400);
}

.card-content-p {
    font-size: 1.2em;
    color: #fff;
    max-width: 560px;
    margin: var(--gap) 0;
}

.card-content .button {
    color: var(--color-blue--400);
    background: transparent;
    border-width: 0px;
    font-size: 1.5em;
    font-weight: 400;
    padding: 0px;
}
</style>
