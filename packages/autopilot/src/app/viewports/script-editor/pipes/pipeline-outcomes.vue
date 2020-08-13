<template>
    <div class="pipeline-outcomes"
        :class="{ 'pipeline-outcomes--spotlight': isSpotlightEnabled }">

        <div class="pipeline-outcomes__spotlight-warning"
            v-if="isSpotlightEnabled">
            <div class="group group--gap--small">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Result restricted by Spotlight</span>
            </div>
            <div>
                <button class="button button--outlined-primary button--small"
                    @click="disableSpotlight">
                    View all results
                </button>
            </div>
        </div>

        <template v-if="outcomes">
            <div class="pipeline-outcomes__empty"
                v-if="!outcomes.length">
                &times; 0 (expected result)
            </div>

            <div class="pipeline-outcomes__body"
                v-if="outcomes.length"
                @contextmenu.stop.prevent="popupMenu">
                <elem
                    class="elem--inverse"
                    :key="i"
                    v-for="(el, i) of outcomesSlice"
                    :el="el"/>

                <a class="pipeline-outcomes__more"
                    v-if="hasMore"
                    @click="limit *= 2">
                    Show more
                </a>
            </div>
        </template>

        <div class="pipeline-outcomes__empty"
            v-if="!outcomes">
            Result unavailable
        </div>

    </div>
</template>

<script>
import Elem from './elem.vue';
import { menu, clipboard } from '../../../util';

export default {

    components: {
        Elem
    },

    props: {
        pipelineController: { type: Object, required: true }
    },

    data() {
        return {
            limit: 50
        };
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        outcomes() {
            return this.pipelineController.outcomes;
        },

        outcomesSlice() {
            return (this.outcomes || []).slice(0, this.limit);
        },

        hasMore() {
            return (this.outcomes || []).length > this.limit;
        },

        isSpotlightEnabled() {
            return this.pipelineController.isSpotlightEnabled;
        }

    },

    methods: {

        disableSpotlight() {
            this.pipelineController.disableSpotlight();
        },

        popupMenu(ev) {
            menu.popupMenu([
                {
                    label: 'Copy results as JSON',
                    click: () => {
                        this.viewport.copyPipeOutcomesAsJson(this.outcomes || []);
                    },
                },
                {
                    label: 'Copy results as CSV',
                    click: () => {
                        this.viewport.copyPipeOutcomesAsCsv(this.outcomes || []);
                    },
                }
            ]);
        }

    }

};
</script>

<style>
.pipeline-outcomes {
    background: var(--color-cool--600);
    color: #fff;
}

.pipeline-outcomes--spotlight {
    border-bottom: 6px solid var(--color-yellow--500);
}

.pipeline-outcomes__spotlight-warning {
    display: flex;
    justify-content: space-between;
    padding: var(--gap--small);
    background: var(--color-yellow--500);
    color: #fff;
}

.pipeline-outcomes__body {
    padding: var(--gap);
}

.pipeline-outcomes__more {
    display: block;
    padding: var(--gap) 0;
    color: #fff;
}

.pipeline-outcomes__empty {
    padding: var(--gap);
}
</style>
