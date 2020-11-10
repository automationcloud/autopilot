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

import Autocomplete from './autocomplete.vue';
import CodeMirror from './codemirror.vue';
import EditJson from './edit-json.vue';
import Error from './error.vue';
import Expand from './expand.vue';
import Explore from './explore.vue';
import Help from './help.vue';
import InsertLine from './insert-line.vue';
import LinkAction from './link-action.vue';
import LinkContext from './link-context.vue';
import Loader from './loader.vue';
import Modal from './modal.vue';
import PromoRobotSchool from './promo-robot-school.vue';
import Sb from './sb.vue';
import SigninWarning from './signin-warning.vue';
import Toggle from './toggle.vue';
import ValidationError from './validation-error.vue';

Vue.component('autocomplete', Autocomplete);
Vue.component('codemirror', CodeMirror);
Vue.component('edit-json', EditJson);
Vue.component('error', Error);
Vue.component('expand', Expand);
Vue.component('explore', Explore);
Vue.component('help', Help);
Vue.component('insert-line', InsertLine);
Vue.component('link-action', LinkAction);
Vue.component('link-context', LinkContext);
Vue.component('loader', Loader);
Vue.component('modal', Modal);
Vue.component('promo-robot-school', PromoRobotSchool);
Vue.component('sb', Sb);
Vue.component('signin-warning', SigninWarning);
Vue.component('toggle', Toggle);
Vue.component('validation-error', ValidationError);
