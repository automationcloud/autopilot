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

/* eslint-disable import/no-default-export */

declare module '*.json' {
    // eslint-disable-next-line init-declarations
    const value: any;
    export default value;
}

declare module '*.vue' {
    import Vue from 'vue';
    export default Vue;
}

declare module 'promise-smart-throttle' {
    function throttle<T>(fn: (...args: any[]) => Promise<T>, delay?: number): (...args: any[]) => Promise<T>;
    export default throttle;
}
