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

import { inject, injectable } from 'inversify';
import { controller } from '../controller';
import { UserData } from '../userdata';
import { StorageController } from './storage';

export interface PipeRecipe {
    name: string;
    pipes: any[];
}

export interface PipeGroup {
    name: string;
    recipes: PipeRecipe[];
}

@injectable()
@controller({ alias: 'pipeRecipes' })
export class PipeRecipesController {
    userData: UserData;

    pipeGroups: PipeGroup[] = [];

    constructor(
        @inject(StorageController)
        storage: StorageController,
    ) {
        this.userData = storage.createUserData('recipes');
    }

    async init() {
        const data = await this.userData.loadData();
        this.pipeGroups = data.pipeGroups || [];
    }

    update() {
        this.userData.update({
            pipeGroups: this.pipeGroups,
        });
    }
}
