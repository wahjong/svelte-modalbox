<script lang="ts">
import { onMount } from 'svelte';
import Modal from './Modal.svelte';
import type ModalBox from './ModalBox.svelte';
import type { TModalClose, TModalOpen, ModalParams } from './Modal.svelte';

type Props = {
    ariadescribedby?: string;
    arialabelledby?: string;
    contentholder: HTMLElement;
    disabledEscape: boolean;
    headerholder?: HTMLElement;
    headerItems: number;
    height?: string;
    hideFootClose: boolean;
    hideXClose: boolean;
    name?: string;
    target: HTMLElement;
    width?: string;
}

let {
    ariadescribedby,
    arialabelledby,
    contentholder,
    disabledEscape = false,
    headerholder,
    headerItems = 0,
    height,
    hideFootClose = true,
    hideXClose = false,
    name,
    target,
    width,
}: Props = $props();

let button = $state<HTMLButtonElement>();
let modal = $state<Modal>();

let ModalOpen = $state<TModalOpen>();
let ModalClose = $state<TModalClose>();
let hasHeader = $derived(headerItems > 0 || !hideXClose);

const contents = [...target.children];
const headers = contents.splice(0, headerItems);

export function close() {
    if (ModalClose)
        ModalClose();
}

export function open(this: ModalBox, url: string, params: ModalParams = {}) {

    if (ModalOpen)
        ModalOpen(this, url, params);

    const iframe = contentholder.querySelector("iframe");

    if (url && iframe) {

        if (width) {
            const contentStyles = getComputedStyle(contentholder.parentElement as Element);

            const _width = params.width || iframe.width;

            const _width0 = !_width || isNaN(Number(_width))
                ? _width
                : Number(_width)
                    - parseFloat(contentStyles.paddingLeft)
                    - parseFloat(contentStyles.paddingRight);

            iframe.width = String(_width0);
        }

        if (params.name)
            iframe.name = params.name;

        if (params.title)
            iframe.title = params.title;

        iframe.src = url;

        iframe.onload = (event) => {
            if (!modal) return;

            modal.fitSize(true);
        }
    }
}

function ModalOnEscape(event: KeyboardEvent) {
    if (!disabledEscape) close();
}

function ModalOnOpened() {
    target.hidden = false;
}

function ModalOnClosed() {
    target.hidden = true;
}

export function hide() {
    modal!.hide();
}

export function show() {
    modal!.show();
}

export function isdisabled() {
    return modal!.isdisabled();
}

export function ishidden() {
    return modal!.ishidden();
}

export function isopened() {
    return modal!.isopened();
}

export function getName() {
    return name;
}

export function scrollPosition() {
    return modal!.scrollPosition();
}

export function setSize(h, w) {
    modal!.setOriginalSize(h, w);
}

onMount(() => {

    if (headerholder)
        headerholder.append(...headers);

    contentholder.append(...contents);
});

</script>

<!-- ModalBox.svelte -->
<!-- ariadescribedby: {ariadescribedby}, -->
<!-- arialabelledby: {arialabelledby}, -->
<!-- button: {button}, -->
<!-- contentholder: {contentholder}, -->
<!-- disabledEscape: {disabledEscape}, -->
<!-- hasHeader: {hasHeader}, -->
<!-- headerholder: {headerholder}, -->
<!-- headerItems: {headerItems}, -->
<!-- height: {height}, -->
<!-- hideFootClose: {hideFootClose}, -->
<!-- hideXClose: {hideXClose}, -->
<!-- modal: {modal}, -->
<!-- target: {target}, -->
<!-- width: {width}, -->

<Modal
    bind:this={modal}
    bind:open={ModalOpen}
    bind:close={ModalClose}

    onEscape={ModalOnEscape}
    onClosed={ModalOnClosed}
    onOpened={ModalOnOpened}

    {height}
    {width}
    {arialabelledby}
    {ariadescribedby}
    {hideXClose}

    {name}
    what='ModalBox'
>
    {#snippet header(a, b)}
        {#if hasHeader}
        <div bind:this={headerholder}></div>
        {/if}
    {/snippet}

    {#snippet content()}
        <div bind:this={contentholder}></div>
    {/snippet}

    {#snippet footer()}
        {#if !hideFootClose}
        <button type="button"
            class="btn2 btn2-info"
            bind:this={button}
            onclick={close}
        >Close</button>
        {/if}
    {/snippet}

</Modal>

<style type="text/scss">
</style>
