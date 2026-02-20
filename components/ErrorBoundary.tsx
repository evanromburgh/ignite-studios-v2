import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-8 text-center">
          <div className="flex items-center">
            <span className="text-4xl font-black tracking-tighter text-white leading-none">IGNITE</span>
            <div className="h-6 w-[1px] bg-zinc-800 mx-4"></div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] leading-none">STUDIOS</span>
          </div>
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <p className="text-zinc-500 text-sm font-medium max-w-md">
            Something unexpected happened. Please refresh the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="h-[46px] px-8 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
