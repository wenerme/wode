declare global {
  interface ShadowRootInit {
    mode: ShadowRootMode;
    delegatesFocus?: boolean;
  }

  interface CaretPosition {
    offsetNode: Node;
    offset: number;

    getClientRect(): ClientRect;
  }

  interface DocumentOrShadowRoot {
    getSelection(): Selection | null;

    elementFromPoint(x: number, y: number): Element | null;

    elementsFromPoint(x: number, y: number): NodeListOf<Element>;

    caretPositionFromPoint(x: number, y: number): CaretPosition | null;

    activeElement: Element | null;
    styleSheets: StyleSheetList;
  }

  interface ShadowRoot extends DocumentFragment, DocumentOrShadowRoot, Element {
    host: HTMLElement;
    mode: ShadowRootMode;

    adoptedStyleSheets: ReadonlyArray<CSSStyleSheet>;
  }

  type Document = DocumentOrShadowRoot;

  interface AssignedNodesOptions {
    flatten: boolean;
  }

  interface HTMLSlotElement extends HTMLElement {
    name: string;

    assignedNodes(options?: AssignedNodesOptions): NodeList;
  }

  interface Node {
    attachShadow(shadowRootInitDict: ShadowRootInit): ShadowRoot;

    assignedSlot: HTMLSlotElement | null;
    slot: string;
    shadowRoot: ShadowRoot | null;
  }

  interface Node {
    getRootNode(options?: GetRootNodeOptions): Node | ShadowRoot;
  }

  interface CSSStyleSheet {
    replaceSync(text: string): void;

    replace(text: string): Promise<void>;
  }
}

export {};
