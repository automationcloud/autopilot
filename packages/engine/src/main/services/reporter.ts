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

import { injectable } from 'inversify';

export type ReportingLevel = 'debug' | 'info' | 'error' | 'mute';

@injectable()
export class ReporterService {
    static LEVELS: ReportingLevel[] = ['debug', 'info', 'error', 'mute'];

    checkLevel(requested: ReportingLevel, desired: ReportingLevel) {
        return ReporterService.LEVELS.indexOf(requested) >= ReporterService.LEVELS.indexOf(desired);
    }

    async sendScreenshot(_level: ReportingLevel, _options?: ScreenshotSpec) {}
    async sendHtmlSnapshot(_level: ReportingLevel) {}
    async sendEvent(_level: ReportingLevel, _eventName: string, _eventData?: EventData) {}
}

export interface ScreenshotSpec {
    label?: string;
    isPublic?: boolean;
    fullPage?: boolean;
    minHeight?: number;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
}

export interface EventData {
    details?: any;
    action?: any;
    context?: any;
}
