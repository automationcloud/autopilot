import { util } from '@automationcloud/engine';
import { helpers } from '../../../util';

export default {
    props: {
        param: { type: Object, required: true },
        item: { type: Object, required: true },
        itemProxy: { type: Object, required: true },
        inputSet: { type: Array, required: true },
        pipelineController: { type: Object },
    },

    computed: {
        viewport() {
            return this.app.viewports.scriptEditor;
        },
        label() {
            return this.param.label || util.humanize(this.param.name);
        },
        script() {
            return this.app.project.script;
        },

        el() {
            return this.inputSet[0] || null;
        },

        value: {
            get() {
                return this.item[this.param.name];
            },
            set(newValue) {
                this.itemProxy[this.param.name] = newValue;
            },
        }
    },

    methods: {
        createSourceOptions(source) {
            const info = (this.el && this.el.info) || {};
            switch (source) {
                case 'attributes':
                    return Object.keys(info.attributes || {});
                case 'classList':
                    return info.classList || [];
                case 'inputs':
                    return this.app.datasets.getInputKeys();
                case 'outputs':
                    return this.app.tools.getOutputKeys();
                case 'stages':
                    return this.script.getStageKeys();
                case 'globals':
                    return this.script.getGlobalKeys();
                case 'dataPaths': {
                    const value = this.el && this.el.value;
                    if (!value || typeof value !== 'object') {
                        return [];
                    }
                    return helpers.collectPointers(value).map(_ => _.path);
                }
                case 'errorCodes':
                    return this.app.tools.getErrorCodeSuggestions();
                default:
                    return [];
            }
        },
    },
};
