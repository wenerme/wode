/**
 * Minimal, browser-safe XML reader for WebDAV multistatus responses.
 * Supports elements, attributes (ignored), text, CDATA, comments, processing instructions and
 * the predefined/numeric entities. Namespaces are matched by local name only (sufficient for
 * the DAV: multistatus subset); namespace URIs are not resolved. DOCTYPE is rejected to avoid entity expansion tricks.
 */
export interface XmlElement {
	/** Local name without namespace prefix. */
	name: string;
	children: XmlElement[];
	text: string;
}

const Entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeXmlEntities(value: string): string {
	return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (match, entity: string) => {
		if (entity[0] === '#') {
			const code = entity[1] === 'x' ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
			if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) throw new Error('Invalid XML entity');
			return String.fromCodePoint(code);
		}
		const decoded = Entities[entity];
		if (decoded === undefined) throw new Error('Invalid XML entity');
		return decoded;
	});
}

function localName(qname: string) {
	const index = qname.indexOf(':');
	return index < 0 ? qname : qname.slice(index + 1);
}

export function parseXml(xml: string): XmlElement {
	const root: XmlElement = { name: '#document', children: [], text: '' };
	const stack: XmlElement[] = [root];
	let i = 0;
	const fail = (): never => {
		throw new Error('Invalid XML');
	};
	while (i < xml.length) {
		const lt = xml.indexOf('<', i);
		const top = stack[stack.length - 1]!;
		if (lt < 0) {
			if (xml.slice(i).trim()) fail();
			break;
		}
		if (lt > i) {
			const text = xml.slice(i, lt);
			// Text outside the root element must be whitespace only.
			if (stack.length === 1) {
				if (text.trim()) fail();
			} else top.text += decodeXmlEntities(text);
		}
		if (xml.startsWith('<!--', lt)) {
			const end = xml.indexOf('-->', lt + 4);
			if (end < 0) fail();
			i = end + 3;
		} else if (xml.startsWith('<![CDATA[', lt)) {
			const end = xml.indexOf(']]>', lt + 9);
			if (end < 0) fail();
			if (stack.length === 1) fail();
			top.text += xml.slice(lt + 9, end);
			i = end + 3;
		} else if (xml.startsWith('<?', lt)) {
			const end = xml.indexOf('?>', lt + 2);
			if (end < 0) fail();
			i = end + 2;
		} else if (xml.startsWith('<!', lt)) {
			fail();
		} else if (xml[lt + 1] === '/') {
			const end = xml.indexOf('>', lt);
			if (end < 0) fail();
			const name = localName(xml.slice(lt + 2, end).trim());
			if (stack.length < 2 || top.name !== name) fail();
			stack.pop();
			i = end + 1;
		} else {
			// Attribute values may contain '>', so scan respecting quotes.
			let j = lt + 1;
			let quote = '';
			for (; j < xml.length; j++) {
				const c = xml[j];
				if (quote) {
					if (c === quote) quote = '';
				} else if (c === '"' || c === "'") quote = c;
				else if (c === '>') break;
			}
			if (j >= xml.length) fail();
			let body = xml.slice(lt + 1, j);
			const selfClosing = body.endsWith('/');
			if (selfClosing) body = body.slice(0, -1);
			const match = /^([A-Za-z_][\w.:-]*)/.exec(body);
			if (!match) fail();
			const element: XmlElement = { name: localName(match![1]!), children: [], text: '' };
			top.children.push(element);
			if (!selfClosing) stack.push(element);
			i = j + 1;
		}
	}
	if (stack.length !== 1) fail();
	const elements = root.children;
	if (elements.length !== 1) fail();
	return elements[0]!;
}

export function xmlChild(element: XmlElement, name: string): XmlElement | undefined {
	return element.children.find((child) => child.name === name);
}

export function xmlChildren(element: XmlElement, name: string): XmlElement[] {
	return element.children.filter((child) => child.name === name);
}
