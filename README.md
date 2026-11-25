# svelte-modalbox

A customizable and accessible modal component for Svelte.

## Installation

```bash
npm install svelte-modalbox
```

### Configuration

The `<modalbox>` element can be configured using `data-*` attributes:

- `data-name` - Name of the global access variable, e.g. `window['modalbox1']`.
- `data-aria-labelledby` - Associates the dialog with its labelling element.
- `data-disabled-escape` - Disables closing the dialog with the Escape key.
- `data-header-items` - Moves the first N elements into the header.
- `data-hide-foot-close` - Hides the close button in the footer.
- `data-hide-x-close` - Hides the X close button in the top-right corner of the dialog.
- `data-height` - Dialog height. Accepts a number or CSS length, e.g. `400`, `100%`, or `calc(100% - 200px)`. If omitted, the intrinsic height is used.
- `data-width` - Dialog width. Accepts a number or CSS length, e.g. `400`, `100%`, or `calc(100% - 200px)`. If omitted, the intrinsic width is used.

### API

#### `setSize(height, width)`

Sets the height and width of the modal.

```js
modalbox.setSize(400, 400);
```

#### `open(url?, params?)`

Opens the modal.

```js
modalbox.open();
```

To open a URL with parameters:

```js
modalbox.open('iframe.html', {
    name: 'aaa',
    title: 'bbb',
    width: '100%'
});
```
