<template>
    <div class="script-search">

        <div class="script-search__criteria"
            v-if="criteria.length">
            <div class="script-search__criterion tag"
                v-for="(crit, i) of criteria">

                <span class="tag__label">
                    <span class="script-search__criterion-type">
                        {{ crit.type }}
                    </span>
                    <span class="script-search__criterion-value">
                        {{ crit.value }}
                    </span>
                </span>
                <a class="tag__remover"
                    @click="removeCriterion(i)">
                    <i class="fas fa-times">
                    </i>
                </a>
            </div>
        </div>

        <div class="input group group--merged stretch">
            <input
                v-model="q"
                v-focus
                placeholder="Type search query"
                @input="onInput"
                @keydown="onKeyDown"/>

            <button class="button button--icon button--flat"
                @click="hide"
                v-if="!criteria.length">
                <i class="fas fa-times"></i>
            </button>

            <template v-if="criteria.length">
                <span class="script-search__results-count">
                    {{ currentResultIdx + 1 }}/{{ results.length }}
                </span>
                <button class="button button--icon button--flat"
                    title="Show previous result"
                    @click="previousResult">
                    <i class="fas fa-chevron-up"></i>
                </button>
                <button class="button button--icon button--flat"
                    title="Show next result"
                    @click="nextResult">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </template>
        </div>

        <div class="script-search__suggestions"
            v-if="suggestions.length">
            <div class="script-search__suggestion"
                :class="{
                    'script-search__suggestion--active': i === suggestionIdx
                }"
                v-for="(suggestion, i) of suggestions"
                @click="addCriterion(suggestion)"
                @mouseenter="suggestionIdx = i">

                <span class="script-search__criterion-type">
                    {{ suggestion.type }}
                </span>
                <span class="script-search__criterion-value">
                    {{ suggestion.value }}
                </span>

            </div>
        </div>

    </div>
</template>

<script>
export default {

    data() {
        return {
            q: '',
            suggestionIdx: 0
        };
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptFlow;
        },

        search() {
            return this.viewport.search;
        },

        currentResultIdx() {
            return this.search.currentResultIdx;
        },

        criteria() {
            return this.search.criteria;
        },

        results() {
            return this.search.results;
        },

        suggestions() {
            return this.search.getSuggestions(this.q);
        },

    },

    methods: {

        nextResult() {
            return this.search.nextResult();
        },

        previousResult() {
            return this.search.previousResult();
        },

        hide() {
            return this.search.shown = false;
        },

        onInput() {
            this.suggestionIdx = 0;
        },

        onKeyDown(ev) {
            switch (ev.key) {
                case 'ArrowDown':
                    this.suggestionIdx = Math.min(this.suggestionIdx + 1, this.suggestions.length - 1);
                    this.scrollToSuggestion();
                    break;
                case 'ArrowUp':
                    this.suggestionIdx = Math.max(this.suggestionIdx - 1, 0);
                    this.scrollToSuggestion();
                    break;
                case 'Enter':
                    const crit = this.suggestions[this.suggestionIdx];
                    if (crit) {
                        this.addCriterion(crit);
                    } else {
                        this.search.nextResult();
                    }
                    break;
                case 'Backspace':
                    if (this.q === '') {
                        this.removeCriterion(this.criteria.length - 1);
                    }
                    break;
                case 'Escape':
                    if (this.criteria.length === 0) {
                        this.hide();
                    }
                    break;
            }
        },

        scrollToSuggestion() {
            this.$nextTick(() => {
                const el = this.$el.querySelector('.script-search__suggestion--active');
                if (el) {
                    el.scrollIntoViewIfNeeded();
                }
            });
        },

        addCriterion(suggestion) {
            this.search.addCriterion(suggestion);
            this.q = '';
            this.suggestionIdx = 0;
        },

        removeCriterion(idx) {
            this.search.removeCriterion(idx);
        }

    }

};
</script>

<style>
.script-search {
    position: relative;
    padding: var(--gap--small);
    background: var(--color-cool--500);
}

.script-search__criteria {
    margin-bottom: var(--gap--small);
}

.script-search__suggestions {
    position: absolute;
    z-index: 100;
    border-radius: var(--border-radius);
    background: #fff;
    box-shadow: 0 3px 8px rgba(0,0,0,.25);
    max-height: 50vh;
    overflow-y: auto;
}

.script-search__suggestion {
    display: block;
    cursor: pointer;
    padding: var(--gap--small);
}

.script-search__suggestion--active {
    background: var(--color-mono--100);
    color: var(--color-blue--500);
}

.script-search__criterion {
    white-space: nowrap;
}

.script-search__criterion-type {
    color: var(--color-mono--500);
    font-size: 11px;
    text-transform: uppercase;
}

.script-search__results-count {
    padding: 0 var(--gap--small);
    color: var(--color-mono--500);
    align-self: center;
}

</style>
