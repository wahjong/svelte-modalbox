import { writable } from 'svelte/store';
import type ModalBox from './ModalBox.svelte';

function uuid() {
  return crypto.randomUUID();
}

const modals = writable<Array<ModalBox>>([]);

export { modals, uuid }
