// Copyright 2020 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Vue from 'vue';
import { App } from './app';
import RootView from './views/root.vue';
import * as util from './util';
import path from 'path';
import { getAppPath } from './globals';
import { createControllerProvider } from './provider';

import './components';
import './directives';

process.env.ENGINE_ENV = 'autopilot';

const app = new App();
(global as any).app = app;

// Modify Node.js require path to allow loading extensions
const localNodeModules = path.join(getAppPath(), 'node_modules');
// eslint-disable-next-line import/no-commonjs
(require('module') as any).globalPaths.push(localNodeModules);

Vue.mixin({
    beforeCreate() {
        const vm = (this as any);
        // Allow components to use `this.app` in their data declarations
        vm.app = app;
    },
    provide: createControllerProvider(app),
    data() {
        return {
            app,
        };
    },
    methods: {
        get(serviceId: any) {
            return app.get(serviceId);
        }
    }
});

app.init().then(() => {
    const controllers = app.getControllerInstances().map(_ => _.instance);
    const rootView = new Vue({
        el: '#app',
        template: '<root-view/>',
        components: { RootView },
        data() {
            return { controllers };
        },
    });
    Object.assign(window, {
        rootView,
    });
});

// Expose globals for DevTools
Object.defineProperties(window, {
    AP: {
        get() {
            return createControllerProvider(app);
        }
    },
    util: { value: util },
    script: {
        get() {
            return app.project.script;
        },
    },
    browser: {
        get() {
            return app.browser;
        },
    },
    page: {
        get() {
            return app.browser.page;
        },
    }
});
