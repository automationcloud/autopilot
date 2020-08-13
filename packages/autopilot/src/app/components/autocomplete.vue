<template>
    <div class="autocomplete"
        :class="{
            'autocomplete--has-options': !!options.length
        }">
        <div class="input stretch"
            :class="inputClass">
            <slot/>
            <input ref="input"
                type="text"
                class="autocomplete__input"
                :size="size"
                :value="value"
                :placeholder="placeholder"
                v-on="inputListeners"
                @focus="onFocus"
                @blur="onBlur"
                @keyup="onKeyUp"/>
        </div>
        <div class="autocomplete__suggestions"
            :class="{
                'autocomplete__suggestions--up': isPopupUp()
            }"
            v-if="!!suggestions.length && focused">
            <div class="autocomplete__suggestion"
                :class="{
                    'autocomplete__suggestion--filtered': s.filtered,
                    'autocomplete__suggestion--unfiltered': !s.filtered,
                    'autocomplete__suggestion--active': i === suggestionIndex
                }"
                v-for="(s, i) in suggestions"
                @mousedown="onSuggestionClick(s)"
                :data-index="i">
                {{ s.opt }}
            </div>
        </div>
    </div>
</template>

<script>
import { helpers } from '../util';

export default {

    data() {
        return {
            focused: false,
            suggestionIndex: 0
        };
    },

    props: {
        value: String,
        placeholder: String,
        inputClass: String,
        size: Number,
        options: {
            type: Array,
            default() {
                return [];
            }
        }
    },

    watch: {

        value() {
            this.suggestionIndex = -1;
        },

        suggestionIndex() {
            this.revealActiveSuggestion();
        },

    },

    computed: {

        inputListeners() {
            return Object.assign({},
                this.$listeners,
                {
                    input: this.onInput,
                },
            );
        },

        suggestions() {
            const result = [];
            const val = (this.value || '').trim().toLowerCase();
            if (val) {
                const filtered = helpers.biasedFuzzySearch(val, this.options, opt => opt)
                    .map(opt => ({ opt, filtered: true }));
                result.push(...filtered);
            }
            for (const opt of this.options) {
                result.push({ opt, filtered: false });
            }
            return result;
        }

    },

    methods: {

        updateValue(value) {
            this.$emit('input', value);
            if (this.$refs.input.value !== value) {
                this.$refs.input.value = value;
            }
        },

        onInput(ev) {
            this.updateValue(ev.target.value);
        },

        onKeyUp(ev) {
            this.$emit('keyup', ev);
            switch (ev.key) {
                case 'ArrowUp':
                    this.suggestionIndex = Math.max(0, this.suggestionIndex - 1);
                    break;
                case 'ArrowDown':
                    this.suggestionIndex = Math.min(this.suggestions.length - 1, this.suggestionIndex + 1);
                    break;
                case 'Enter':
                    if (this.suggestionIndex >= 0) {
                        const s = this.suggestions[this.suggestionIndex];
                        if (s) {
                            this.updateValue(s.opt);
                        }
                    }
                    this.$refs.input.blur();
                    break;
                case 'Escape':
                    this.$refs.input.blur();
                    break;
            }
        },

        onSuggestionClick(s) {
            this.updateValue(s.opt);
            this.$refs.input.blur();
            this.$refs.input.dispatchEvent(new Event('change'));
        },

        onFocus() {
            this.focused = true;
        },

        onBlur() {
            this.focused = false;
        },

        getMenu() {
            const menuItems = this.options.reduce((items, option) => {
                items.push({
                    type: 'radio',
                    label: option,
                    checked: this.value === option,
                    click: () => this.updateValue(option)
                });
                return items;
            }, []);
            return menuItems;
        },

        isPopupUp() {
            const { top } = this.$refs.input.getBoundingClientRect();
            return top > window.innerHeight * 0.75;
        },

        revealActiveSuggestion() {
            const el = this.$el.querySelector(`[data-index="${this.suggestionIndex}"]`);
            if (el) {
                el.scrollIntoViewIfNeeded();
            }
        }

    }

};
</script>

<style>
.autocomplete {
    display: flex;
    position: relative;
}

.autocomplete__input {
    flex: 1;
}

.autocomplete__caret {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    z-index: 1;
    right: 4px;
    top: 50%;
    width: 16px;
    height: 16px;
    margin-top: -8px;
    border-radius: var(--border-radius);
    cursor: pointer;
    background: var(--color-warm--300);
}

/*
.autocomplete--has-options .autocomplete__input {
    padding-right: 24px;
}
*/

.autocomplete__suggestions {
    position: absolute;
    z-index: 1000;
    top: 100%;
    right: 1px;
    left: 1px;

    max-height: 160px;
    overflow-y: auto;

    box-shadow: 0 1px 3px rgba(0,0,0,.15);
    background: #fff;
    border-radius: var(--border-radius);
}

.autocomplete__suggestions--up {
    top: auto;
    bottom: 100%;
}

.autocomplete__suggestion {
    display: block;
    padding: var(--gap--small);
    cursor: pointer;
}

.autocomplete__suggestion--filtered {
    font-weight: 500;
}

.autocomplete__suggestion:hover {
    background: var(--color-blue--100);
}

.autocomplete__suggestion--filtered + .autocomplete__suggestion--unfiltered {
    box-shadow: 0 -1px 0 rgba(0,0,0,.1);
}

.autocomplete__suggestion.autocomplete__suggestion--active {
    background: var(--color-blue--500);
    color: #fff;
}
</style>
