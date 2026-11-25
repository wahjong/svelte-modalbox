<script module lang="ts">
import type ModalBox from './ModalBox.svelte';
import type { Snippet } from 'svelte';

export type ModalParams = {
    name?: string;
    title?: string;
    [key: string]: unknown;
};

export type TModalClose = (event?: Event) => void;
export type TModalOpen = (
    origin: ModalBox,
    url?: string,
    params?: ModalParams
) => void;
export type TModalHide = (event?: Event) => void;
export type TModalShow = (event?: Event) => void;
export type TonEscape = (event: KeyboardEvent) => void;
export type TonClosed = () => void;
export type TonOpened = () => void;

type Props = {
    header?: Snippet<[number, number]>;
    toolbar?: Snippet;
    content?: Snippet;
    footer?: Snippet;

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
import { modals, uuid } from './stores';

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
let height0 = height;
let width0 = width;
let disabled = false;
let hidden = true;
let opened = false;
let isBusy: boolean;
let modal = $state<HTMLDivElement>();
let modalBox = $state<HTMLDivElement>();
let isVScroll = $state(false);
let minheight = $state();

let headerStyles: CSSStyleDeclaration;
let contentStyles: CSSStyleDeclaration;

const uid = uuid();

function getContentWidth(node: Node) {

    const clone = node.cloneNode(true) as HTMLElement;

    Object.assign(clone.style, {
        position: 'absolute',
        visibility: 'hidden',
        width: 'max-content',
        maxWidth: 'none',
        whiteSpace: 'nowrap'
    });

    document.body.append(clone);

    const width = clone.getBoundingClientRect().width;

    clone.remove();

    return width;
}

function isOverflow() {

    if (!modalBox) return;

    const viewportHeight = window.innerHeight;
    const modalHeight = modalBox.clientHeight;
    return modalHeight >= viewportHeight;
}

function checkOverflow() {

    if (!modal) return;

    // only if the modal is currently shown
    if (modal.classList.contains('modal-visible')) {
        if (isOverflow()) {
            modal.classList.add('modal-overflow');
        } else {
            modal.classList.remove('modal-overflow');
        }
    }
}

const focusableSelector = `
    a[href]:not([tabindex^="-"]):not([disabled]),
    a[onclick]:not([tabindex^="-"]):not([disabled]),
    button:not([tabindex^="-"]):not([disabled]),
    input:not([tabindex^="-"]):not([disabled]),
    select:not([tabindex^="-"]):not([disabled]),
    textarea:not([tabindex^="-"]):not([disabled]),
    [tabindex]:not([tabindex^="-"]):not([disabled])
`;

export const delay = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function setOriginalSize(h, w) {
    height0 = h;
    width0 = w;

    setSize(h, w);

    await delay(5);

    calculateSize();
}

let focusableEls: Array<HTMLElement>;

export function appendFocusable(ifdoc?: Document) {

    if (!ifdoc) return;

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

    ifdoc.addEventListener('keydown', trapFocus);
}

function getActiveElement() {

    if (document.activeElement instanceof HTMLIFrameElement) {

        const ifdoc = document.activeElement.contentDocument
            || document.activeElement.contentWindow?.document;

        return ifdoc?.activeElement;
    }

    return document.activeElement;
}

function trapFocus(event) {

    if (hidden) return false;

    if (event.key !== 'Tab') return false;

    if (!focusableEls.length) return false;
    const activeEl = getActiveElement();
    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];

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

let prevActiveEl: HTMLElement | null | undefined;

open = async (origin, url, params = {}) => {

    if (!modal) return;

    prevActiveEl = getActiveElement() as HTMLElement;

    if (!hidden) {
        return;
    }

    if ($modals.length) {
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

    await delay(25);

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

    document.addEventListener('keydown', keyboardHandler);
    document.addEventListener('keydown', trapFocus);

    onOpened();

    if (!url) {
        fitSize(false);
    }

    modal.focus();
}

close = (event?: Event) => {

    if (!modal) return;
    if (isBusy) return;

    if (hidden) {
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
    }

    const next = $modals.findLast((modal) => {
        return modal.ishidden() && !modal.isdisabled();
    });

    if (next) {
        next.show();
    } else {
        document.body.classList.remove('body-modal-enabled');
        document.body.style.removeProperty('top');

        const scrollPosition0 = $modals.length ? $modals[0].scrollPosition() : _scrollPosition;

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

    onClosed();

    document.removeEventListener('keydown', keyboardHandler);
    document.removeEventListener('keydown', trapFocus);

    if (prevActiveEl) {
        prevActiveEl.focus();
    }

}

let iframeEl: HTMLIFrameElement | null;

function iframeSize() {

    let ifdocHeight = 0;
    let ifdocWidth = 0;

    iframeEl = contentEl.querySelector('iframe');

    if (!iframeEl || iframeEl.src === 'about:blank') return;

    const ifdoc = iframeEl.contentDocument
        || iframeEl.contentWindow?.document;

    appendFocusable(ifdoc);

    ifdocHeight = getDocumentHeight(ifdoc);
    ifdocWidth = getDocumentWidth(ifdoc);

    if (!modalBox) return;

    iframeEl.height = String(ifdocHeight);

    if (!iframeEl.width)
        iframeEl.width = String(ifdocWidth);

}

function calculateSize() {

    if (!modalBox) return;

    const fullHeight = modalBox.clientHeight;
    const fullWidth = modalBox.clientWidth;

    const freeHeight = Math.max(
        headerHeight,
        fullHeight
        - contentEl.offsetTop
        - toolbarHeight
        - footerHeight
    );

    minheight = (headerHeight
        + toolbarHeight
        + footerHeight
        + 32
        ) + 'px';

    isVScroll = totalHeight > fullHeight;
    if (isVScroll) {
        contentEl.style.height = (freeHeight) + 'px';
    } else if (!height0) {
        modalBox.style.removeProperty('height');
    }
    const h = totalHeight < fullHeight ? null : undefined;
    const w = totalWidth < fullWidth ? null : undefined;
    setSize(h, w);
}

let headerHeight: number;
let headerWidth: number;
let toolbarHeight: number;
let toolbarWidth: number;
let footerHeight: number;
let footerWidth: number;
let contentHeight: number;
let contentWidth: number;
let totalHeight: number;
let totalWidth: number;

export async function fitSize(iframeloaded: boolean = false) {

    setSize('100%', '100%');

    await delay(15);

    const loader = contentEl.firstElementChild;

    if (loader instanceof HTMLElement) {
        loader.hidden = true;
    }

    headerHeight = headerEl.clientHeight;
    headerWidth = getContentWidth(headerEl);
    toolbarHeight = toolbarEl.clientHeight;
    toolbarWidth = getContentWidth(toolbarEl);
    footerHeight = footerEl.clientHeight;
    footerWidth = getContentWidth(footerEl);

    if (iframeloaded) {
        iframeSize();
    }

    contentHeight = contentEl.clientHeight;
    contentWidth = getContentWidth(contentEl);

    totalHeight = contentEl.offsetTop
        + toolbarHeight
        + contentHeight
        + footerHeight
        + 0;

    totalWidth = Math.max(
            headerWidth,
            toolbarWidth,
            contentWidth,
            footerWidth
        );

    setSize(
        height0
            ? /^\d+$/.test(String(height0))
                ? height0 + 'px'
                : height0
            : undefined,
        width0
            ? /^\d+$/.test(String(width0))
                ? width0 + 'px'
                : width0
            : undefined
    );

    await delay(15);

    calculateSize();
}

export function setSize(
    h: string | number | null | undefined,
    w: string | number | null | undefined
) {

    height = h !== undefined ? h : height;
    width = w !== undefined ? w : width;

    headerStyles = getComputedStyle(headerEl);
    contentStyles = getComputedStyle(contentEl);
}

export function setDisabled(v) {
    disabled = v;
}

export function isdisabled() {
    return disabled === true;
}

export function ishidden() {
    return hidden === true;
}

export function isopened() {
    return opened === true;
}

export function scrollPosition() {
    return _scrollPosition;
}

export function hide() {
    if (!modal) return;
    isBusy = false;
    hidden = true;
    modal.hidden = true;
    modal.classList.remove('modal-visible');
}

export function show() {

    if (!modal) return;

    hidden = false;
    modal.hidden = false;

    modal.style.removeProperty('display');

    // prevent double scroll
    _scrollPosition = window.pageYOffset;
    document.body.classList.add('body-modal-enabled');
    document.body.style.top = -_scrollPosition + 'px';

    modal.classList.add('modal-visible');
}

const debounce = (func: (event: Event) => {}, delay: number) => {
    let timer: number | undefined;

    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(context, args), delay);
    };
};

const windowSizeChanged = debounce(async (event: Event) => {

    if (!opened) return;

    calculateSize();

}, 15);

let headerEl: HTMLElement;
let toolbarEl: HTMLElement;
let contentEl: HTMLElement;
let footerEl: HTMLElement;

onMount(() => {

    if (!modalBox) return;

    headerEl = modalBox.children[0] as HTMLElement;
    toolbarEl = modalBox.children[1] as HTMLElement;
    contentEl = modalBox.children[2] as HTMLElement;
    footerEl = modalBox.children[3] as HTMLElement;

    window.addEventListener('resize', windowSizeChanged);

    return () => {
        window.removeEventListener('resize', windowSizeChanged);
    };

});

$effect(() => {
    checkOverflow();
});

let hasHeader = false

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
            `--minheight: ${minheight}`,
            height != null && `height: ${typeof height === 'number' ? `${height}px` : height}`,
            width != null && `width: ${typeof width === 'number' ? `${width}px` : width}`
        ].filter(Boolean).join(';')}
    >

        <div class="header">

            {#if !hideXClose}
            <button type="button"
                class="modal-close"
                aria-label="Close dialog"
                onclick={close}
            >×</button>
            {/if}

            {@render header?.(1, 2)}
        </div>

        <div class="toolbar">
            {@render toolbar?.()}
        </div>

        <div class="content">
            <div>
                <span class="loading" aria-hidden="true"></span>
                <span role="status">Loading, please wait.</span>
            </div>

            {@render content?.()}
        </div>

        <div class="footer">
            {@render footer?.()}
        </div>

    </div>
</div>

<style type="text/scss">
</style>

