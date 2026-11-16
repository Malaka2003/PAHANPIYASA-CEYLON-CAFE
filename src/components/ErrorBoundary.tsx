import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ backgroundColor: '#F6EFE0', color: '#2A1C12' }}
        >
          <div className="max-w-md w-full bg-[#FFFDF8] border border-[#DDD0B6] rounded-2xl p-6 space-y-4 shadow-sm">
            <h1 className="font-display text-2xl font-medium">
              Unable to complete that action
            </h1>
            <p className="text-sm text-[#543E2D] leading-relaxed">
              Something went wrong while communicating with the site service. Please reload the page and try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 min-h-[42px] text-sm font-medium text-white rounded-lg cursor-pointer"
              style={{ backgroundColor: '#2A5C3A' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
