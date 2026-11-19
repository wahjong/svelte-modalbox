<script module lang="ts">
import type ModalBox from './ModalBox.svelte';
import type { Snippet } from 'svelte';

export type TModalClose = (event?: Event) => void;
export type TModalOpen = (
    origin: ModalBox,
    url?: string,
    params?: unknown
) => void;
export type TModalHide = (event?: Event) => void;
export type TModalShow = (event?: Event) => void;
export type TonEscape = (event: KeyboardEvent) => void;
export type TonClosed = () => void;
export type TonOpened = () => void;

type Props = {
    header: Snippet<[number, number]>;
    toolbar?: Snippet;
    content: Snippet;
    footer: Snippet;

    arialabelledby?: string;
    ariadescribedby?: string;

    close?: TModalClose;
    open?: TModalOpen;

    hasfiles?: boolean;
    haslink?: boolean;
    hasmap?: boolean;
    haspeople?: boolean;
    hastags?: boolean;
    hastemplates?: boolean;

    onEscape: TonEscape;
    onClosed: TonClosed;
    onOpened: TonOpened;

    hideXClose: boolean;
    height?: string | number | null;
    width?: string | number | null;
    what?: string;
    name?: string;
}
</script>

<script lang="ts">
import { onMount } from 'svelte';
import { modals } from './stores';

let {
    header,
    toolbar,
    content,
    footer,

    arialabelledby,
    ariadescribedby,

    close = $bindable(),
    open = $bindable(),

    hasfiles = false,
    haslink = false,
    hasmap = false,
    haspeople = false,
    hastags = false,
    hastemplates = false,

    onEscape,
    onClosed,
    onOpened,

    hideXClose = false,
    height,
    width,
    what,
    name
}: Props = $props();

let _scrollPosition: number;
let width0 = width;
let disabled = false;
let hidden = true;
let opened = false;
let isBusy: boolean;
let modal = $state<HTMLDivElement>();
let modalBox = $state<HTMLDivElement>();
let isHScroll = $state(false);
let isVScroll = $state(false);

const rand = Math.random();

function isOverflow() {
    if (!modalBox) return;
    console.log('Modal.isOverflow', modalBox.clientHeight);

    const viewportHeight = window.innerHeight;
    const modalHeight = modalBox.clientHeight;
    return modalHeight >= viewportHeight;
}

function checkOverflow() {
    if (!modal) return;
    console.log('%cModal.checkOverflow', 'background-color:green');

    // only if the modal is currently shown
    if (modal.classList.contains('modal-visible')) {
        if (isOverflow()) {
            modal.classList.add('modal-overflow');
        } else {
            modal.classList.remove('modal-overflow');
        }
    }
}

let prevActiveEl: HTMLElement | null | undefined;
let focusableEls: Array<HTMLElement>;

const focusableSelector = `
    a[href]:not([tabindex^="-"]):not([disabled]),
    a[onclick]:not([tabindex^="-"]):not([disabled]),
    button:not([tabindex^="-"]):not([disabled]),
    input:not([tabindex^="-"]):not([disabled]),
    select:not([tabindex^="-"]):not([disabled]),
    textarea:not([tabindex^="-"]):not([disabled]),
    [tabindex]:not([tabindex^="-"]):not([disabled])
`;


export function appendFocusable(ifdoc?: Document) {

    if (!ifdoc) return;
    console.log('%cModal.appendFocusable', 'background-color:green', ifdoc);

    const iframeFocusableEls = Array.from(
        ifdoc?.querySelectorAll<HTMLElement>(focusableSelector)
    )
    .filter(el => !el.hidden)
    .filter(el => el.offsetParent !== null);

    focusableEls = [
        focusableEls[0],
        ...iframeFocusableEls,
        ...focusableEls.slice(1)
    ];
    console.log('%cfocusableEls', 'background-color:orange', focusableEls);

    ifdoc.addEventListener('keydown', trapFocus);
}

function getActiveElement() {
    console.log('%cModal.getActiveElement', 'background-color:green', document.activeElement);

    if (document.activeElement instanceof HTMLIFrameElement) {

        const ifdoc = document.activeElement.contentDocument
            || document.activeElement.contentWindow?.document;

        return ifdoc?.activeElement;
    }

    return document.activeElement;
}

function trapFocus(event) {
    console.log('%ctrapFocus', 'background-color:green', event, what);

    if (hidden) return false;

    if (event.key !== 'Tab') return false;

    if (!focusableEls.length) return false;

    console.log('%cModal.trapFocus', 'background-color:green', event);
    const activeEl = getActiveElement();
    console.log('%cactiveEl', 'background-color:hotpink', activeEl);
    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];
    console.log('%cfirst', 'background-color:brown', first);
    console.log('%clast', 'background-color:brown', last);

    if (event.shiftKey) {
        if (activeEl === first || activeEl === modal) {
            event.preventDefault();
            last.focus();
        }
    } else {
        if (activeEl === last || activeEl === modal) {
            event.preventDefault();
            first.focus();
        }
    }
}

/**
 * You do not need to check if an identical event listener is already added;
 * standard JavaScript behavior automatically discards duplicate listeners.
 */
function keyboardHandler(event) {
    console.log('%cModal.keyboardHandler', 'background-color:green', event, what);

    if (hidden)
        return false;

    if (event.key === 'Escape')
        onEscape(event);
}

function getDocumentHeight(doc) {
    const body = doc.body;
    const html = doc.documentElement;

    return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
    );
}

function getDocumentWidth(doc) {
    const body = doc.body;
    const html = doc.documentElement;

    return Math.max(
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
    );
}

close = (event?: Event) => {
    console.log('%cModal.close', 'background-color:green', event, what, name);

    if (!modal) return;
    if (isBusy) return;

    if (hidden) {
        console.log('%c%s hidden is %s, not close return', 'background-color:brown', what, hidden);
        return;
    }

    isBusy = true;

    contentEl.style.removeProperty('height');
    modal.classList.remove('modal-visible');
    modal.hidden = true;

    isBusy = false;
    hidden = true;
    opened = false;
    height = undefined;
    width = undefined;

    const current = $modals.pop(); // thrown away current modal
    if (current) {
        console.log('%cthrown away current modal', 'background-color:blue', current.getName());
    }
    console.log('%c$modals.length', 'background-color:purple', $modals.length);

    const next = $modals.findLast((modal) => {
        return modal.ishidden() && !modal.isdisabled();
    });

    if (next) {
        console.log('%cnext', 'background-color:purple', next.getName());
        next.show();
    } else {
        console.log('%c$modals[$modals.length - 1]', 'background-color:blue', $modals[$modals.length - 1]);
        document.body.classList.remove('body-modal-enabled');
        document.body.style.removeProperty('top');

        const scrollPosition0 = $modals.length ? $modals[0].scrollPosition() : _scrollPosition;
        console.log('%cscrollPosition0', 'background-color:blue', scrollPosition0);

        window.scrollTo({
            top: scrollPosition0,
            behavior: 'instant'
        });
    }

    if (iframeEl) {
        iframeEl.src = 'about:blank';
        iframeEl.removeAttribute('height');
    }

    contentEl.style.removeProperty('height');

    const loader = contentEl.firstElementChild;

    if (loader instanceof HTMLElement) {
        loader.hidden = false;
    }

    t1_open = null;
    t1_fitsize = null;

    onClosed();

    document.removeEventListener('keydown', keyboardHandler);
    document.removeEventListener('keydown', trapFocus);

    if (prevActiveEl) {
        console.log('%cprevActiveEl.focus()', 'background-color:purple', prevActiveEl);
        prevActiveEl.focus();
    }

}

let t1_open: number | null;
let t1_fitsize: number | null;

open = (origin, url, params) => {
    console.log('%cModal.open', 'background-color:green', origin, url, params, what, name);

    if (!modal) return;

    prevActiveEl = getActiveElement() as HTMLElement;
    console.log('%cprevActiveEl', 'background-color:purple', prevActiveEl);

    if (!hidden) {
        console.log('%c%s hidden %s, not open', 'background-color:brown', what, hidden);
        return;
    }

    if ($modals.length) {
        console.log('%chiding last modal first', 'background-color:purple', $modals[$modals.length - 1]);
        $modals[$modals.length - 1].hide();
    }

    if (origin) {
        $modals.push(origin);
    }

    if (isBusy) return;

    isBusy = true;

    modal.style.removeProperty('display');

    // prevent double scroll
    _scrollPosition = window.pageYOffset;
    document.body.classList.add('body-modal-enabled');
    document.body.style.top = -_scrollPosition + 'px';

    modal.classList.add('modal-visible');

    isBusy = false;
    hidden = false;
    opened = true;
    modal.hidden = false;

    t1_open = setTimeout(() => {

        if (!modal) return;

        /**
         * The filter here is to make sure the selected elements are visible(in the layout).
         * According to https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent, offsetParent returns null when the element has style.
         * display set to none. (including children elements)
         */
        focusableEls = Array.from(
            modal.querySelectorAll<HTMLElement>(focusableSelector)
        )
        .filter(el => !el.hidden);
        console.log('%cfocusableEls', 'background-color:orange', focusableEls);

        document.addEventListener('keydown', keyboardHandler);
        document.addEventListener('keydown', trapFocus);

        onOpened();

        if (!url) {
            fitSize();
        }

        modal.focus();

    }, 25);
}

export function fitSize() {

    if (!modalBox) return;
    console.log('%cModal.fitSize()', 'background-color:green');

    iframeEl = contentEl.querySelector('iframe');

    const headerStyles = getComputedStyle(headerEl);
    const contentStyles = getComputedStyle(contentEl);

    const minHeight = modalBox.clientHeight;
    const minWidth = modalBox.clientWidth;
    console.log('%cminHeight', 'background-color:brown', minHeight);
    console.log('%cminWidth', 'background-color:brown', minWidth);

    setSize('100%', '100%');

    let ifdocHeight = 0;
    let ifdocWidth = 0;

    t1_fitsize = setTimeout(() => {

        if (!modalBox) return;

        const headerHeight = headerEl.clientHeight;
        const headerWidth = headerEl.clientWidth;
        const toolbarHeight = toolbarEl.clientHeight;
        const toolbarWidth = toolbarEl.clientWidth;
        const footerHeight = footerEl.clientHeight;
        console.log('%cheaderHeight', 'background-color:purple', headerHeight);
        console.log('%ctoolbarHeight', 'background-color:purple', toolbarHeight);
        console.log('%cfooterHeight', 'background-color:purple', footerHeight);
        console.log('%cheaderWidth', 'background-color:purple', headerWidth);
        console.log('%ctoolbarWidth', 'background-color:purple', toolbarWidth);

        const loader = contentEl.firstElementChild;

        if (loader instanceof HTMLElement) {
            loader.hidden = true;
        }

        if (iframeEl) {

            console.log('%ciframeEl.src', 'background-color:blue', iframeEl.src);
            if (iframeEl.src == 'about:blank') return;

            const ifdoc = iframeEl.contentDocument
                || iframeEl.contentWindow?.document;

            appendFocusable(ifdoc);

            ifdocHeight = getDocumentHeight(ifdoc);
            ifdocWidth = getDocumentWidth(ifdoc);
            console.log('%cifdocHeight', 'background-color:brown', ifdocHeight);
            console.log('%cifdocWidth', 'background-color:brown', ifdocWidth);

            iframeEl.height = String(ifdocHeight);
            iframeEl.width = String(ifdocWidth);

        }

        const fullHeight = modalBox.clientHeight;
        const fullWidth = modalBox.clientWidth;
        console.log('%cfullHeight', 'background-color:brown', fullHeight);
        console.log('%cfullWidth', 'background-color:brown', fullWidth);

        const contentHeight = contentEl.clientHeight;
        const contentWidth = contentEl.clientWidth;
        console.log('%ccontentHeight', 'background-color:brown', contentHeight);
        console.log('%ccontentWidth', 'background-color:brown', contentWidth);

        const totalHeight = headerHeight
            + toolbarHeight
            + contentHeight
            + footerHeight
            + 0;
        console.log('%ctotalHeight', 'background-color:brown', totalHeight);

        const totalWidth = Math.max(
                headerWidth,
                toolbarWidth,
                contentWidth,
                footerHeight
            );
        console.log('%ctotalWidth', 'background-color:brown', totalWidth);

        const freeHeight = fullHeight
            - headerHeight
            - toolbarHeight
            - footerHeight
            - parseFloat(headerStyles.marginTop)
            - parseFloat(headerStyles.marginBottom)
            - parseFloat(contentStyles.paddingTop)
            - parseFloat(contentStyles.paddingBottom)
            - 0;
        console.log('%cfreeHeight', 'background-color:blue', freeHeight);

        isVScroll = totalHeight > fullHeight;
        isHScroll = totalWidth > fullWidth;
        console.log('%cisVScroll', 'background-color:hotpink', isVScroll);
        console.log('%cisHScroll', 'background-color:hotpink', isHScroll);

        if (isVScroll) {
            contentEl.style.height = (freeHeight) + 'px';
        } else {
            modalBox!.style.removeProperty('height');
        }

        setSize(
            isVScroll
                ? 'calc(100% - 8px)'
                : null,

            isHScroll
                ? 'calc(100% - 8px)'
                : /^\d+$/.test(String(width0) ?? '')
                    ? width0 + 'px'
                    : width0 || totalWidth
        );

    }, 25);
}

export function setSize(h: string | number | null, w: string | number | null) {
    console.log('%cModal.setSize', 'background-color:green', h, w, what);
    height = h;
    width = w;
}

export function setDisabled(v) {
    console.log('%cModal.setDisabled', 'background-color:green', v, what);
    disabled = v;
}

export function isdisabled() {
    console.log('%cModal.isdisabled', 'background-color:green', what, disabled);
    return disabled === true;
}

export function ishidden() {
    console.log('%cModal.ishidden', 'background-color:green', what, hidden);
    return hidden === true;
}

export function isopened() {
    console.log('%cModal.isopened', 'background-color:green', what, opened);
    return opened === true;
}

export function scrollPosition() {
    console.log('%cModal.scrollPosition', 'background-color:green', what);
    return _scrollPosition;
}

export function hide() {
    if (!modal) return;
    console.log('%cModal.hide', 'background-color:green', name);
    isBusy = false;
    hidden = true;
    modal.hidden = true;
    modal.classList.remove('modal-visible');
}

export function show() {
    if (!modal) return;
    console.log('%cModal.show', 'background-color:green', what);
    hidden = false;
    modal.hidden = false;

    modal.style.removeProperty('display');

    // prevent double scroll
    _scrollPosition = window.pageYOffset;
    document.body.classList.add('body-modal-enabled');
    document.body.style.top = -_scrollPosition + 'px';

    modal.classList.add('modal-visible');

}

let headerEl: HTMLElement;
let toolbarEl: HTMLElement;
let contentEl: HTMLElement;
let footerEl: HTMLElement;
let iframeEl: HTMLIFrameElement | null;

onMount(() => {

    if (!modalBox) return;
    console.log('%cModal.onMount', 'background-color:green');
    console.log('%cmodal', 'background-color:purple', modal);

    headerEl = modalBox.children[0] as HTMLElement;
    toolbarEl = modalBox.children[1] as HTMLElement;
    contentEl = modalBox.children[2] as HTMLElement;
    footerEl = modalBox.children[3] as HTMLElement;

    return () => {
    };

});

$effect(() => {
    console.log('%cModal.$effect', 'background-color:green')
    checkOverflow();
});

</script>

<div class="tingle-modal"
    tabindex="-1"
    bind:this={modal}
    hidden
>

    <div role="dialog"
        bind:this={modalBox}
        aria-modal="true"
        aria-labelledby={arialabelledby}
        aria-describedby={ariadescribedby}
        style={[
            width != null && `width:${typeof width === 'number' ? `${width}px` : width}`,
            height != null && `height:${typeof height === 'number' ? `${height}px` : height}`
        ].filter(Boolean).join(';')}
    >
        <div class="header"
            class:isVScroll
            class:isHScroll
        >
            <!-- Modal.svelte -->
            <!-- $modals.length: {$modals.length}, -->
            <!-- _scrollPosition: {_scrollPosition}, -->
            <!-- ariadescribedby: {ariadescribedby}, -->
            <!-- arialabelledby: {arialabelledby}, -->
            <!-- disabled: {disabled}, -->
            <!-- focusableEls:{focusableEls}, -->
            <!-- height: {height}, -->
            <!-- hidden: {hidden}, -->
            <!-- hideXClose: {hideXClose},{typeof hideXClose}, -->
            <!-- isHScroll: {isHScroll}, -->
            <!-- isVScroll: {isVScroll}, -->
            <!-- modal: {modal}, -->
            <!-- modalBox: {modalBox}, -->
            <!-- opened: {opened}, -->
            <!-- prevActiveEl:{prevActiveEl}, -->
            <!-- rand: {rand}, -->
            <!-- width0: {width0}, -->
            <!-- width: {width}, -->

            {#if !hideXClose}
            <button type="button"
                class="modal-close"
                aria-label="Close dialog"
                onclick={close}
            >×</button>
            {/if}

            {@render header(1, 2)}
        </div>

        <div class="toolbar">
            {@render toolbar?.()}
        </div>

        <div class="content">
            <div>
                <span class="loading" aria-hidden="true"></span>
                <span role="status">Loading, please wait.</span>
            </div>

            {@render content()}
        </div>

        <div class="footer">
            {@render footer()}
        </div>

    </div>
</div>

<style type="text/scss">
</style>

