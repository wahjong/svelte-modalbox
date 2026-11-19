import { get, writable } from 'svelte/store';
import type ModalBox from './ModalBox.svelte';

function uuid() {

    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4();
}

const store = writable({});
const modals = writable<Array<ModalBox>>([]);

export { modals, store, get, uuid }
