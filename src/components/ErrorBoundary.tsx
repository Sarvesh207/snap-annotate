import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort fallback for unexpected render errors, including a failed lazy load of the
 * annotation editor (e.g. the network dropped). Shows a recoverable screen instead of a blank page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="grid h-full place-content-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="max-w-sm text-sm text-neutral-400">
          The app hit an unexpected error. Reloading usually fixes it, for example after a dropped
          connection.
        </p>
        <Button variant="primary" className="mx-auto mt-2" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    );
  }
}
