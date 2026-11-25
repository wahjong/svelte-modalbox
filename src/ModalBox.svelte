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
console.log('%ccontents', 'background-color:green', contents);
console.log('%cheaders', 'background-color:green', headers);

export function close() {
    console.log('%cModalBox.close', 'background-color:green');
    if (ModalClose)
        ModalClose();
}

export function open(this: ModalBox, url: string, params: ModalParams = {}) {
    console.log('%cModalBox.open', 'background-color:green', url, params);

    if (ModalOpen)
        ModalOpen(this, url, params);

    const iframe = contentholder.querySelector("iframe");
    console.log('%ciframe', 'background-color:purple', iframe);

    if (url && iframe) {

        if (width) {
            const contentStyles = getComputedStyle(contentholder.parentElement as Element);
            console.log('%cpaddingLeft', 'background-color:orange', contentStyles.paddingLeft);
            console.log('%cpaddingRight', 'background-color:orange', contentStyles.paddingRight);
            console.log('%cborderLeftWidth', 'background-color:orange', contentStyles.borderLeftWidth);

            console.log('%ciframe.width:%s, isNaN(Number(iframe.width):%s', 'background-color:purple', iframe.width, isNaN(Number(iframe.width)));
            console.log('%cparams.width:%s, isNaN(Number(params.width):%s', 'background-color:purple', params.width, isNaN(Number(params.width)));

            const _width = params.width || iframe.width;
            console.log('%c_width, String(_width)', 'background-color:blue', _width, String(_width));

            const _width0 = !_width || isNaN(Number(_width))
                ? _width
                : Number(_width)
                    - parseFloat(contentStyles.paddingLeft)
                    - parseFloat(contentStyles.paddingRight);

            console.log('%c_width0, String(_width0)', 'background-color:blue', _width0, String(_width0));

            iframe.width = String(_width0);
        }

        if (params.name)
            iframe.name = params.name;

        if (params.title)
            iframe.title = params.title;

        iframe.src = url;

        iframe.onload = (event) => {
            console.log('%ciframe.onload', 'background-color:green', event);
            if (!modal) return;

            modal.fitSize(true);
        }
    }
}

function ModalOnEscape(event: KeyboardEvent) {
    console.log('%cModalBox.Escape', 'background-color:green', event);
    if (!disabledEscape) close();
}

function ModalOnOpened() {
    console.log('%cModalBox.ModalOnOpened', 'background-color:green');
    target.hidden = false;
}

function ModalOnClosed() {
    console.log('%cModalBox.ModalOnClosed', 'background-color:green');
    target.hidden = true;
}

export function hide() {
    console.log('%cModalBox.hide', 'background-color:green', name);
    modal!.hide();
}

export function show() {
    console.log('%cModalBox.show', 'background-color:green', name);
    modal!.show();
}

export function isdisabled() {
    console.log('%cModalBox.isdisabled', 'background-color:green');
    return modal!.isdisabled();
}

export function ishidden() {
    console.log('%cModalBox.ishidden', 'background-color:green', name);
    return modal!.ishidden();
}

export function isopened() {
    console.log('%cModalBox.isopened', 'background-color:green', name);
    return modal!.isopened();
}

export function getName() {
    console.log('%cModalBox.getName', 'background-color:green');
    return name;
}

export function scrollPosition() {
    console.log('%cModalBox.scrollPosition', 'background-color:green');
    return modal!.scrollPosition();
}

export function setSize(h, w) {
    console.log('%cModalBox.setSize(%s, %s)', 'background-color:green', h, w);
    modal!.setOriginalSize(h, w);
}

onMount(() => {
    console.log('%cModalBox.onMount', 'background-color:green');

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
