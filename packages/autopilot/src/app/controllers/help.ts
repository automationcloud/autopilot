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

import { controller } from '../controller';
import { mdToHtml } from '../util/helpers';
import { inject, injectable } from 'inversify';
import { ResolverService } from '@automationcloud/engine';
import { ModalsController } from './modals';

@injectable()
@controller({ alias: 'help' })
export class HelpController {
    helpItem: HelpItem | null = null;

    constructor(
        @inject(ResolverService)
        protected resolver: ResolverService,
        @inject(ModalsController)
        protected modals: ModalsController,
    ) {}

    async init() {}

    getActionHelp(type: string): string {
        const { help } = this.getActionHelpItem(type);
        return help;
    }

    getPipeHelp(type: string): string {
        const { help } = this.getPipeHelpItem(type);
        return help;
    }

    protected getActionHelpItem(type: string): HelpItem {
        const ActionClass = this.resolver.getActionClass(type);
        const text = ActionClass.$help.trim();
        const help = text ? mdToHtml(text) : '';

        return {
            label: ActionClass.$type,
            help,
        };
    }

    protected getPipeHelpItem(type: string): HelpItem {
        const PipeClass = this.resolver.getPipeClass(type);
        const text = PipeClass.$help.trim();
        const help = text ? mdToHtml(text) : '';

        return {
            label: PipeClass.$type,
            help,
        };
    }

    showActionHelpModal(type: string) {
        this.helpItem = this.getActionHelpItem(type);
        this.modals.show('help');
    }

    showPipeHelpModal(type: string) {
        this.helpItem = this.getPipeHelpItem(type);
        this.modals.show('help');
    }

}

export interface HelpObject {
    type: string;
    text: string;
    html: string;
}

export interface HelpItem {
    label: string;
    help: string;
}
