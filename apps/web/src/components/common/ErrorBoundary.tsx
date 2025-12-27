import { Component, ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { showToast } from './Toast';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ((props: { error: Error | null; resetError: () => void }) => ReactNode) | ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo: {
        componentStack: errorInfo.componentStack || '',
      },
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleCopyError = async () => {
    if (!this.state.error) return;

    const errorDetails = [
      '=== ERROR DETAILS ===',
      '',
      `Error: ${this.state.error.toString()}`,
      '',
      `Timestamp: ${new Date().toISOString()}`,
      `Route: ${window.location.pathname}`,
      '',
    ];

    if (this.state.errorInfo?.componentStack) {
      errorDetails.push('Component Stack:');
      errorDetails.push(this.state.errorInfo.componentStack);
      errorDetails.push('');
    }

    if (this.state.error.stack) {
      errorDetails.push('Stack Trace:');
      errorDetails.push(this.state.error.stack);
    }

    const textToCopy = errorDetails.join('\n');

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        showToast('Copied to clipboard', 'success');
        return;
      }
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }

    // Fallback: use textarea + execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        showToast('Copied to clipboard', 'success');
      } else {
        showToast('Failed to copy. Please select and copy manually.', 'error');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      showToast('Failed to copy. Please select and copy manually.', 'error');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({ 
            error: this.state.error, 
            resetError: this.handleReset 
          });
        }
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full">
            <div className="p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                <p className="text-gray-600">
                  An error occurred while rendering this page. Please try reloading.
                </p>
              </div>

              {this.state.error && (
                <div className="mb-6">
                  <details className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <summary className="cursor-pointer font-medium text-red-900 mb-2">
                      Error Details
                    </summary>
                    <div className="mt-2 space-y-2 text-sm">
                      <div>
                        <strong className="text-red-800">Error:</strong>
                        <pre className="mt-1 text-red-700 whitespace-pre-wrap break-words">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong className="text-red-800">Component Stack:</strong>
                          <pre className="mt-1 text-red-700 whitespace-pre-wrap break-words text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div className="flex justify-center gap-3">
                <Button onClick={this.handleReload}>Reload Page</Button>
                <Button
                  variant="outline"
                  onClick={this.handleCopyError}
                  disabled={!this.state.error}
                >
                  Copy Error
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
