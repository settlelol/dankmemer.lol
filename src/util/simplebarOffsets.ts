/**
 * **Must only be used when one Simplebar instance is on the document**
 * @description Move SimpleBar vertical scrollbar so that it looks better for page content.
 * @param offset Value to offset the vertical scroll bar horizontally in pixel units.
 * @default offset `-15px`
 */
export const offsetVerticalSimplebar = (offset: number = -15) => {
	const hScroll = document.querySelectorAll("div.simplebar-track:nth-child(2)")[0];
	const vScroll = document.querySelectorAll("div.simplebar-track:nth-child(3)")[0];
	hScroll.setAttribute("style", "display: none;");
	vScroll.setAttribute("data-simplebar-v-scroll-offset", "");
	vScroll.setAttribute("style", `--v-scroll-offset: ${offset}px;`);
};
