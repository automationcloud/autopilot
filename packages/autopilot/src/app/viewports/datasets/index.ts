import { StatelessViewport } from '../../viewport';
import { helpers, clipboard } from '../../util';
import {
    DatasetsController,
    Dataset,
    DatasetInput,
} from '../../controllers/datasets';

export class DatasetsViewport extends StatelessViewport {
    getViewportId(): string {
        return 'datasets';
    }

    getViewportName(): string {
        return 'Input';
    }

    getViewportIcon(): string {
        return 'fas fa-sign-in-alt';
    }

    get datasets() {
        return this.app.get(DatasetsController);
    }

    createCurrentDatasetProxy(): Dataset {
        const ds = this.datasets.getCurrentDataset();
        return helpers.createEditProxy(ds, (k, v) => {
            (ds as any)[k] = v;
            this.datasets.update();
        });
    }

    save() {
        this.datasets.update();
    }

    getInputExpandId(input: DatasetInput) {
        const ds = this.datasets.getCurrentDataset();
        return (
            'ds-' +
            this.datasets.currentIndex +
            '-' +
            ds.inputs.findIndex(_ => _.key === input.key && _.stage === input.stage)
        );
    }

    getJsonInputs() {
        const res: any = {};
        for (const input of this.datasets.getCurrentDataset().inputs) {
            res[input.key] = input.data;
        }
        return res;
    }

    addInput(input: DatasetInput, overwrite: boolean = false) {
        const ds = this.datasets.getCurrentDataset();
        const existing = ds.inputs.find(_ => _.key === input.key && _.stage === input.stage);
        if (existing) {
            if (!overwrite) {
                return;
            }
            existing.data = input.data;
        } else {
            ds.inputs.push({
                key: input.key || '',
                stage: input.stage || '',
                data: input.data || null,
            });
        }
        this.app.expandable.expand(this.getInputExpandId(input));
        this.save();
    }

    removeInput(idx: number) {
        const ds = this.datasets.getCurrentDataset();
        ds.inputs.splice(idx, 1);
        this.save();
    }

    pasteInputs() {
        const inputs = clipboard.readObjectData('dataset-inputs');
        if (!inputs || !Array.isArray(inputs)) {
            return;
        }
        for (const i of inputs) {
            this.addInput(i, true);
        }
    }

    canPasteInputs() {
        return clipboard.hasObjectType('dataset-inputs');
    }
}
