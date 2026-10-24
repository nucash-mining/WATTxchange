import React from 'react';

// Keeps a crash inside one nuChain tab from blanking the whole site.
export default class TabErrorBoundary extends React.Component<{ children: React.ReactNode; name: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error(`[nuChain ${this.props.name}]`, error); }
  render() {
    if (this.state.error) {
      return (
        <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-6 text-sm text-red-300">
          The {this.props.name} tab hit an error and was stopped so the rest of the site keeps working.
          <div className="text-xs text-red-400/80 mt-2 break-words">{this.state.error.message}</div>
          <button className="mt-3 px-3 py-1.5 rounded-md bg-slate-800 text-slate-200" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
