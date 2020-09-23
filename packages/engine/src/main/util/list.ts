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

export function partitionBy<T, K>(items: T[], keyFn: (item: T) => K): T[][] {
    const partitions = [];
    let lastPartition: T[] | null = null;
    let lastKey: any = null;
    for (const item of items) {
        const key = keyFn(item);
        if (lastPartition && lastKey === key) {
            lastPartition.push(item);
        } else {
            lastPartition = [item];
            lastKey = key;
            partitions.push(lastPartition);
        }
    }
    return partitions;
}
