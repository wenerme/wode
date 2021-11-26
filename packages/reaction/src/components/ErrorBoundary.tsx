import React, { ErrorInfo, ReactElement } from 'react';

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
}

/**
 * ErrorBoundary will catch the error and invoke the renderError to render the content
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, { error? }> {
  static defaultProps = {
    onError: ({ error, errorInfo }) => console.error(`ErrorBoundary catch:`, error, errorInfo),
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
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
