<script lang="ts">
import { onMount } from 'svelte';
import Modal from './Modal.svelte';
import type ModalBox from './ModalBox.svelte';
import type { TModalClose, TModalOpen } from './Modal.svelte';

type Props = {
    ariadescribedby?: string;
    arialabelledby?: string;
    contentholder: HTMLElement;
    disabledEscape: boolean;
    headerholder: HTMLElement;
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

const contents = [...target.children];
const headers = contents.splice(0, headerItems);
// console.log('%ccontents', 'background-color:green', contents);
// console.log('%cheaders', 'background-color:green', headers);

export function close() {
    console.log('%cModalBox.close', 'background-color:green');
    if (ModalClose)
        ModalClose();
}

export function open(this: ModalBox, url: string, params) {
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

            const _width = Number(width)
                - parseFloat(contentStyles.paddingLeft)
                - parseFloat(contentStyles.paddingRight);

            console.log('%c_width', 'background-color:blue', _width);

            iframe.width = String(_width);

        }

        iframe.src = url;

        if (iframe.name)
            iframe.name = params.name;

        const title = iframe.title || params.title || '';
        console.log('%ctitle' , 'background-color:purple', title);

        if (title)
            iframe.title = title;

        iframe.onload = (event) => {
            console.log('%ciframe.onload', 'background-color:green', event);
            modal!.fitSize();
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
    modal!.setSize(h, w);
}

onMount(() => {
    console.log('%cModalBox.onMount', 'background-color:green');
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
        <div bind:this={headerholder}></div>
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
