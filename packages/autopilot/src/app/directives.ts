import Vue from 'vue';

Vue.directive('focus', {
    inserted(el) {
        el.focus();
    },
});

Vue.directive('select', {
    inserted(el: any) {
        if (typeof el.select === 'function') {
            el.select();
        }
    },
});
