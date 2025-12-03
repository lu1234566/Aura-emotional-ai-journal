import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare props to avoid TypeScript error
  declare props: Readonly<ErrorBoundaryProps>;
  
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-center text-red-400">Algo deu errado.</div>;
    }
    return this.props.children;
  }
}