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

export const actionRenameMap: { [key: string]: string } = {

};

export const pipeRenameMap: { [key: string]: string } = {
    'Browser.getBlob': 'Data.getBlob',
    'Flow.computeOutcome': 'Data.computeOutcome',
};

export function migrateActionSpec(spec: any = {}): any {
    const renamedType = actionRenameMap[spec.type];
    if (renamedType) {
        spec.type = renamedType;
    }
    return spec;
}

export function migratePipeSpec(spec: any = {}): any {
    const renamedType = pipeRenameMap[spec.type];
    if (renamedType) {
        spec.type = renamedType;
    }
    return spec;
}
