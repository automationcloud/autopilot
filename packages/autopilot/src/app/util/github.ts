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

import assert from 'assert';

export interface GitHubFile {
    type: 'dir' | 'file';
    name: string;
    path: string;
    sha: string;
}

export class GitHubClient {
    token: string;
    repo: string;

    constructor(token: string, repo: string) {
        this.token = token;
        this.repo = repo;
    }

    async resolveBranchSha(branch: string): Promise<string> {
        const res = await this.ghFetch({
            url: `/git/refs/heads/${branch}`,
        });
        return res.object.sha;
    }

    async getContents(path: string, ref: string): Promise<GitHubFile[]> {
        return await this.ghFetch({
            url: `/contents/${path}`,
            query: {
                ref,
            },
        });
    }

    async getBlob(sha: string): Promise<string> {
        const { encoding, content } = await this.ghFetch({
            url: `/git/blobs/${sha}`,
        });
        assert.equal(encoding, 'base64');
        return Buffer.from(content, 'base64').toString();
    }

    async ghFetch(
        options: {
            url?: string;
            baseUrl?: string;
            method?: string;
            body?: any;
            query?: any;
            timeout?: number;
        } = {},
    ) {
        const { url, baseUrl = `/repos/${this.repo}`, method = 'GET', body = null, query = {} } = options;
        const qs = createQuery(query);
        const fullUrl = ['https://api.github.com', baseUrl, url, qs].join('');
        const response = await window.fetch(fullUrl, {
            method,
            body: body == null ? null : JSON.stringify(body),
            headers: {
                Authorization: `token ${this.token}`,
            },
        });
        const status = response.status;
        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('application/json')) {
            const json = await response.json();
            if (status === 401) {
                throw new Error(
                    'GitHub Token not configured properly. ' +
                        'Please go to Settings > Developer Settings > Access Tokens and add ' +
                        'access token with "repo" scope',
                );
            }
            if (status >= 400) {
                const err: any = new Error(`Request to GH API failed: ${status} ${method} ${url}`);
                err.details = json;
                throw err;
            }
            return json;
        }

        throw new Error(`GH request failed: unsupported content type ${contentType}`);
    }
}

function createQuery(qs: any): string {
    const params = Object.keys(qs)
        .map(k => {
            const val = qs[k];
            return val != null ? encodeURIComponent(k) + '=' + encodeURIComponent(val) : '';
        })
        .filter(Boolean)
        .join('&');
    return params.length ? '?' + params : '';
}
