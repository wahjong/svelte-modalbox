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
console.log('%cuid', 'background-color:blue', uid);

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
    console.log('%cModal.isOverflow', 'background-color:green', modalBox.clientHeight);

    if (!modalBox) return;

    const viewportHeight = window.innerHeight;
    const modalHeight = modalBox.clientHeight;
    return modalHeight >= viewportHeight;
}

function checkOverflow() {
    console.log('%cModal.checkOverflow', 'background-color:green');

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
    console.log('%cModal.appendFocusable', 'background-color:green', ifdoc);

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

let prevActiveEl: HTMLElement | null | undefined;

open = async (origin, url, params = {}) => {
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
    console.log('%cfocusableEls', 'background-color:orange', focusableEls);

    document.addEventListener('keydown', keyboardHandler);
    document.addEventListener('keydown', trapFocus);

    onOpened();

    if (!url) {
        fitSize(false);
    }

    modal.focus();
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

    onClosed();

    document.removeEventListener('keydown', keyboardHandler);
    document.removeEventListener('keydown', trapFocus);

    if (prevActiveEl) {
        console.log('%cprevActiveEl.focus()', 'background-color:purple', prevActiveEl);
        prevActiveEl.focus();
    }

}

let iframeEl: HTMLIFrameElement | null;

function iframeSize() {
    console.log('%ciframeSize', 'background-color:green');

    let ifdocHeight = 0;
    let ifdocWidth = 0;

    iframeEl = contentEl.querySelector('iframe');
    console.log('%ciframeEl', 'background-color:purple', iframeEl);

    if (!iframeEl || iframeEl.src === 'about:blank') return;

    const ifdoc = iframeEl.contentDocument
        || iframeEl.contentWindow?.document;
    console.log('%cifdoc', 'background-color:purple', ifdoc);

    appendFocusable(ifdoc);

    ifdocHeight = getDocumentHeight(ifdoc);
    ifdocWidth = getDocumentWidth(ifdoc);
    console.log('%cifdocHeight', 'background-color:purple', ifdocHeight);
    console.log('%cifdocWidth', 'background-color:purple', ifdocWidth);

    if (!modalBox) return;

    iframeEl.height = String(ifdocHeight);

    if (!iframeEl.width)
        iframeEl.width = String(ifdocWidth);

}

function calculateSize() {
    console.log('%ccalculateSize', 'background-color:green');

    if (!modalBox) return;

    const fullHeight = modalBox.clientHeight;
    const fullWidth = modalBox.clientWidth;
    console.log('%cfullHeight', 'background-color:purple', fullHeight);
    console.log('%cfullWidth', 'background-color:purple', fullWidth);

    const freeHeight = Math.max(
        headerHeight,
        fullHeight
        - contentEl.offsetTop
        - toolbarHeight
        - footerHeight
    );
    console.log('%cfreeHeight', 'background-color:purple', freeHeight);

    minheight = (headerHeight
        + toolbarHeight
        + footerHeight
        + 32
        ) + 'px';
    console.log('%cminheight', 'background-color:purple', minheight);

    isVScroll = totalHeight > fullHeight;
    console.log('%cisVScroll', 'background-color:hotpink', isVScroll);

    console.log('%cheight0', 'background-color:purple', height0);
    if (isVScroll) {
        contentEl.style.height = (freeHeight) + 'px';
    } else if (!height0) {
        modalBox.style.removeProperty('height');
    }

    console.log('%ctotalWidth:%s < fullWidth:%s', 'background-color:purple', totalWidth, fullWidth);
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
    console.log('%cModal.fitSize()', 'background-color:green', iframeloaded);

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
    console.log('%cheaderHeight', 'background-color:purple', headerHeight);
    console.log('%cheaderWidth', 'background-color:purple', headerWidth);
    console.log('%ctoolbarHeight', 'background-color:purple', toolbarHeight);
    console.log('%ctoolbarWidth', 'background-color:purple', toolbarWidth);
    console.log('%cfooterHeight', 'background-color:purple', footerHeight);
    console.log('%cfooterWidth', 'background-color:purple', footerWidth);

    if (iframeloaded) {
        iframeSize();
    }

    contentHeight = contentEl.clientHeight;
    contentWidth = getContentWidth(contentEl);
    console.log('%ccontentHeight', 'background-color:purple', contentHeight);
    console.log('%ccontentWidth', 'background-color:purple', contentWidth);

    totalHeight = contentEl.offsetTop
        + toolbarHeight
        + contentHeight
        + footerHeight
        + 0;
    console.log('%ctotalHeight', 'background-color:purple', totalHeight);

    totalWidth = Math.max(
            headerWidth,
            toolbarWidth,
            contentWidth,
            footerWidth
        );
    console.log('%ctotalWidth', 'background-color:purple', totalWidth);

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
    console.log('%cModal.setSize', 'background-color:green', h, w);

    height = h !== undefined ? h : height;
    width = w !== undefined ? w : width;

    headerStyles = getComputedStyle(headerEl);
    contentStyles = getComputedStyle(contentEl);
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
    console.log('%cModal.show', 'background-color:green', what);

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
    console.log('%cwindowSizeChanged', 'background-color:green', event);

    if (!opened) return;

    calculateSize();

}, 15);

let headerEl: HTMLElement;
let toolbarEl: HTMLElement;
let contentEl: HTMLElement;
let footerEl: HTMLElement;

onMount(() => {
    console.log('%cModal.onMount', 'background-color:green');
    console.log('%cmodalBox', 'background-color:purple', modalBox);

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
    console.log('%cModal.$effect', 'background-color:green')
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
            <!-- Modal.svelte -->
            <!-- $modals.length: {$modals.length}, -->
            <!-- _scrollPosition: {_scrollPosition}, -->
            <!-- ariadescribedby: {ariadescribedby}, -->
            <!-- arialabelledby: {arialabelledby}, -->
            <!-- disabled: {disabled}, -->
            <!-- focusableEls:{focusableEls}, -->
            <!-- height0: {height0}, -->
            <!-- height: {height}, -->
            <!-- hidden: {hidden}, -->
            <!-- hideXClose: {hideXClose},{typeof hideXClose}, -->
            <!-- isVScroll: {isVScroll}, -->
            <!-- modal: {modal}, -->
            <!-- modalBox: {modalBox}, -->
            <!-- opened: {opened}, -->
            <!-- prevActiveEl:{prevActiveEl}, -->
            <!-- width0: {width0}, -->
            <!-- width: {width}, -->

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

