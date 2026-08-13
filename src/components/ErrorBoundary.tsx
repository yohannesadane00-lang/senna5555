import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-md text-center">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              An unexpected error occurred while loading the application view.
            </p>
            {this.state.error?.message && (
              <div className="bg-gray-50 dark:bg-neutral-800/80 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 text-rose-700 dark:text-rose-300 text-xs font-mono mb-6 text-left break-words max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#184528] hover:bg-[#12331b] text-white font-medium text-sm rounded-xl shadow-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props?.children;
  }
}
