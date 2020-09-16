import { InspectionReport, InspectionLevel } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { ProjectController } from './project';

/**
 * Makes sure extensions are loaded in a consistent manner, that is,
 * development extensions taking precedence over installed ones.
 */
@injectable()
@controller()
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
