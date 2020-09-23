// Copyright 2020 Ubio Limited
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

declare module 'parse-color' {
    interface Color {
        rgb: [number, number, number];
        hsl: [number, number, number];
        hsv: [number, number, number];
        cmyk: [number, number, number, number];
        keyword?: string;
        hex: string;
        rgba: [number, number, number, number];
        hsla: [number, number, number, number];
        hsva: [number, number, number, number];
        cmyka: [number, number, number, number, number];
    }

    function parseColor(str: string): Color;
    export = parseColor;
}

declare module 'data-urls' {
    function parse(dataUrl: string): { mimeType: string; body: Buffer } | null;
    export = parse;
}

declare module 'jsonpointer' {
    export function get(object: any, path: string): any;
    export function set(object: any, path: string, value: any): void;
}
