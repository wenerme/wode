import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

const hasWindow = typeof window !== 'undefined';
const constructableStylesheetsSupported =
  hasWindow &&
  window.ShadowRoot &&
  window.ShadowRoot.prototype.hasOwnProperty('adoptedStyleSheets') &&
  window.CSSStyleSheet &&
  window.CSSStyleSheet.prototype.hasOwnProperty('replace');
const shadowRootSupported = hasWindow && window.Element && window.Element.prototype.hasOwnProperty('attachShadow');

export interface ReactShadowRootProps {
  delegatesFocus?: boolean;
  mode?: ShadowRootMode;
  stylesheets?: CSSStyleSheet[];
  children?: React.ReactNode;
}

/**
 * ReactShadowRoot place children in shadow-root
 * @see {@link https://github.com/apearce/react-shadow-root}
 */
export class ReactShadowRoot extends React.PureComponent<ReactShadowRootProps> {
  static constructableStylesheetsSupported = constructableStylesheetsSupported;
  static defaultProps = {
    delegatesFocus: false,
    mode: 'open',
  };
  static displayName = 'ReactShadowRoot';
  static propTypes = {};
  static shadowRootSupported = shadowRootSupported;
  private shadowRoot?: ShadowRoot;
  private placeholder: React.RefObject<HTMLElement>;
  state = { initialized: false };

  /**
   * @param {ReactShadowRootProps} props Properties passed to the component
   * @param {boolean} props.delegatesFocus  Expands the focus behavior of elements within the shadow DOM.
   * @param {string} props.mode Sets the mode of the shadow root. (open or closed)
   * @param {CSSStyleSheet[]} props.stylesheets Takes an array of CSSStyleSheet objects for constructable stylesheets.
   */
  constructor(props: ReactShadowRootProps) {
    super(props);
    this.placeholder = React.createRef();
  }

  componentDidMount() {
    const { delegatesFocus, mode = 'open', stylesheets } = this.props;

    this.shadowRoot = (this.placeholder.current?.parentNode as Element)?.attachShadow({
      delegatesFocus,
      mode,
    });

    if (stylesheets && this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = stylesheets;
    }

    this.setState({
      initialized: true,
    });
  }

  render() {
    if (!this.state.initialized) {
      return <span ref={this.placeholder} />;
    }
    return ReactDOM.createPortal(this.props.children, this.shadowRoot!);
  }
}

if (__DEV__) {
  ReactShadowRoot.propTypes = {
    delegatesFocus: PropTypes.bool,
    mode: PropTypes.oneOf(['open', 'closed']),
    // stylesheets: PropTypes.arrayOf(PropTypes.instanceOf(window.CSSStyleSheet)),
  };
}

declare global {
  interface ShadowRoot {
    // Chrome 73+
    // @see {@link https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets }
    adoptedStyleSheets?: ReadonlyArray<CSSStyleSheet>;
  }
}
