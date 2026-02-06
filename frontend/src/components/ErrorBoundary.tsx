import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Something went wrong
            </h2>
            <p className="text-[var(--text-muted)] mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.handleRetry}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AsyncErrorFallback({ error, onRetry }: { error: Error | null; onRetry?: () => void }) {
  if (!error) return null;

  return (
    <div className="card p-8">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Failed to load data
        </h2>
        <p className="text-[var(--text-muted)] mb-6">
          {error.message || 'An unexpected error occurred while fetching data'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
