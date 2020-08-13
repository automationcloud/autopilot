import { App } from '../app';
import { UserData } from '../userdata';

export interface PipeRecipe {
    name: string;
    pipes: any[];
}

export interface PipeGroup {
    name: string;
    recipes: PipeRecipe[];
}

export class RecipeManager {
    app: App;
    userData: UserData;

    pipeGroups: PipeGroup[] = [];

    constructor(app: App) {
        this.app = app;
        this.userData = app.storage.createUserData('recipes');
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
