const _utf8Encode = new TextEncoder();

export function toBase64(str: string): string {
	const uint8Array = _utf8Encode.encode(str);
	const binary = String.fromCharCode(...uint8Array);
	return btoa(binary);
}

// Implementation:
/**
 * Encodes an HTML attribute using the browser's DOM methods
 */
export function encodeAttr(text: string): string {
	const elem = document.createElement("p");
	elem.setAttribute("title", text);
	const elemHtml = elem.outerHTML; // <p title="encodedText"> or maybe <p title='encodedText'>
	elem.remove();
	// Find out whether the browser used single or double quotes before encodedText
	const quote = elemHtml[elemHtml.search(/['"]/)];
	// Split up the generated HTML using the quote character; take item 1
	return elemHtml.split(new RegExp(quote))[1];
}