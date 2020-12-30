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

import { InspectionReport, InspectionLevel } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { ProjectController } from './project';

/**
 * Makes sure extensions are loaded in a consistent manner, that is,
 * development extensions taking precedence over installed ones.
 */
@injectable()
@controller({ alias: 'scriptReport' })
export class ScriptReportController {
    busy: boolean = false;
    errors: InspectionReport[] = [];
    warnings: InspectionReport[] = [];
    infos: InspectionReport[] = [];

    constructor(
        @inject(ProjectController)
        protected project: ProjectController,
    ) {
    }

    async init() {
        this.reset();
    }

    reset() {
        this.errors = [];
        this.warnings = [];
        this.infos = [];
    }

    async runInspections() {
        this.reset();
        this.busy = true;
        try {
            const script = this.project.script;
            for (const report of script.inspect()) {
                switch (report.level) {
                    case InspectionLevel.Info:
                        this.infos.push(report);
                        break;
                    case InspectionLevel.Warn:
                        this.warnings.push(report);
                        break;
                    case InspectionLevel.Error:
                        this.errors.push(report);
                        break;
                }
            }
        } finally {
            this.busy = false;
        }
    }

}
