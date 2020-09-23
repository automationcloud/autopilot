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

import { ProtocolProvider, Domain } from '@ubio/protocol';
import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { ProjectController } from './project';
import { EventBus } from '../event-bus';
import { ExecutionError, ApiController } from './api';

@injectable()
@controller({
    backgroundInit: true
})
export class ProtocolController {
    protocolProvider: ProtocolProvider;
    executionErrors: ExecutionError[] = [];

    constructor(
        @inject(ProjectController)
        protected project: ProjectController,
        @inject(EventBus)
        protected events: EventBus,
        @inject(ApiController)
        protected api: ApiController,
    ) {
        this.protocolProvider = new ProtocolProvider({
            ttl: 10 * 60000,
            autoRefresh: true,
            url: 'https://protocol.automationcloud.net/schema.json',
        });
        this.protocolProvider.latest = null;
        this.events.on('serviceUpdated', () => this.refreshExecutionErrors());
    }

    async init() {
        await this.refresh();
        await this.refreshExecutionErrors().catch(() => { });
    }

    async refresh() {
        await this.protocolProvider.fetchLatest();
    }

    forceRefresh() {
        this.protocolProvider.forceRefreshLatest()
            .catch(err => console.error('Protocol fetch failed', err));
    }

    getAvailableDomains(): Domain[] {
        const { latest } = this.protocolProvider;
        return latest ? latest.getDomains() : [];
    }

    getDomain(): Domain | null {
        const { latest } = this.protocolProvider;
        if (!latest) {
            return null;
        }
        return latest.getDomain(this.project.metadata.domainId) ?? null;
    }

    getInputKeys(): string[] {
        const domain = this.getDomain();
        return domain ? domain.getInputs().map(_ => _.key) : [];
    }

    getOutputKeys(): string[] {
        const domain = this.getDomain();
        return domain ? domain.getOutputs().map(_ => _.key) : [];
    }

    getErrorCodeSuggestions(): string[] {
        const domain = this.getDomain();
        if (!domain) {
            return [];
        }
        return this.executionErrors.map(e => e.code);
    }

    async refreshExecutionErrors() {
        try {
            const domain = this.getDomain();
            this.executionErrors = await this.api.getExecutionErrors('Generic');
            if (domain) {
                this.executionErrors.push(...(await this.api.getExecutionErrors(domain.id)));
            }
            this.executionErrors.sort((a, b) => (a.code < b.code ? -1 : 1));
            console.info('Execution errors refreshed');
        } catch (err) {
            if (err.status !== 401) {
                console.warn('Execution errors fetch failed', err);
            }
            this.executionErrors = [];
        }
    }

}
