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

import { Script } from './script';
import { Action } from './action';
import { Context } from './context';

export type InspectionNode = Script | Context | Action;

export enum InspectionLevel {
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
}

export interface InspectionReport {
    name: string;
    message: string;
    level: InspectionLevel;
    details?: any;
    action?: Action;
    context?: Context;
}

export interface InspectionClass {
    new(script: Script): Inspection<InspectionNode>;
}

/**
 * Allows implementing script validations and reports, accessible in Autopilot.
 *
 * @alpha
 */
export abstract class Inspection<T extends InspectionNode> {
    abstract inspect(node: T): Iterable<InspectionReport>;
}

export abstract class ScriptInspection extends Inspection<Script> {}
export abstract class ContextInspection extends Inspection<Context> {}
export abstract class ActionInspection extends Inspection<Action> {}
