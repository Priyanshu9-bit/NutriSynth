import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
    console.error('[NutriSynth] Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('nutrisynth_active_session');
      localStorage.removeItem('nutrisynth_guest_streak');
      localStorage.removeItem('nutrisynth_guest_challenge');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1e2025] border border-stone-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display font-extrabold text-2xl text-white">
                Something went wrong
              </h2>
              <p className="text-sm text-stone-400 leading-relaxed">
                NutriSynth caught an unexpected issue. You can reload or reset stored state to restore the app.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 font-mono text-left overflow-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-semibold text-sm transition-all"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface SectionProps {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
}

interface SectionState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Section-level error boundary.
 * Prevents a failure in any individual widget, chart, or sub-view from breaking the entire application.
 */
export class SectionErrorBoundary extends Component<SectionProps, SectionState> {
  public state: SectionState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): SectionState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[NutriSynth Section Recovered]', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 sm:p-6 rounded-2xl bg-stone-900/50 dark:bg-[#1a1c22]/60 border border-stone-200 dark:border-stone-800 shadow-sm text-center space-y-3 animate-fade-in my-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm text-stone-900 dark:text-white">
              {this.props.fallbackTitle || 'Component Recovered Gracefully'}
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              An isolated issue occurred in this section, but the rest of NutriSynth remains fully operational.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Reloading Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

