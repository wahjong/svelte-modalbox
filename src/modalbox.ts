import { mount } from 'svelte';
import ModalBox from './ModalBox.svelte';

document.querySelectorAll<HTMLElement>('modalbox').forEach((ele, i) => {

    let name = ele.dataset.name ||  "modalbox_" + i;

    window[name] = mount(ModalBox, {
        target: ele,
        props: {
            target: ele,
            arialabelledby: ele.dataset.ariaLabelledby,
            ariadescribedby: ele.dataset.ariaDescribedby,
            disabledEscape: ele.dataset.disabledEscape == "true",
            headerItems: Number(ele.dataset.headerItems ?? '0'),
            hideXClose: ele.dataset.hideXClose == "true",
            hideFootClose: ele.dataset.hideFootClose == "true"
                || !ele.dataset.hideFootClose,
            height: ele.dataset['height'],
            name,
            width: ele.dataset['width']
        }
    });
    // window[name].open();
});
