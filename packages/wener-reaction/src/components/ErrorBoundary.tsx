import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  /**
   * render the content when error happened
   * @param props error context
   */
  renderError?: (props: { error: any; reset: () => void }) => ReactElement<any, any> | null;
  /**
   * default to console.error
   * @param e error context
   */
  onError?: (e: { error: Error; errorInfo: ErrorInfo }) => void;
  children?: ReactNode;
}

/**
 * ErrorBoundary will catch the error and invoke the renderError to render the content
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { error?: any }> {
  static defaultProps: ErrorBoundaryProps = {
    onError: ({ error, errorInfo }) => console.error(`ErrorBoundary catch:`, error, errorInfo),
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.({ error, errorInfo });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.renderError?.({ error: this.state.error, reset: this.reset }) ?? null;
    }
    return this.props.children;
  }
}
