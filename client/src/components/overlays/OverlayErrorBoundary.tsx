import React, { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";

type FallbackRenderArgs = { error: Error; resetError: () => void };

interface OverlayErrorBoundaryProps {
  children: ReactNode;
  overlayId: string;
  /** Static fallback node (shown if provided and error occurs) */
  fallback?: ReactNode;
  /** Function fallback — receives the error and resetError */
  fallbackRender?: (args: FallbackRenderArgs) => ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, info: ErrorInfo & { overlayId: string }) => void;
  /** When any of these values change, the boundary will auto-reset */
  resetKeys?: unknown[];
}

interface OverlayErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

function shallowArrayChanged(a?: unknown[], b?: unknown[]) {
  if (a === b) return false;
  if (!a || !b) return !!(a || b);
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}

export default class OverlayErrorBoundary extends Component<
  OverlayErrorBoundaryProps,
  OverlayErrorBoundaryState
> {
  constructor(props: OverlayErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): OverlayErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, overlayId } = this.props;
    if (onError) {
      onError(error, { ...errorInfo, overlayId });
    }
    console.error(`[OverlayErrorBoundary:${overlayId}]`, error, errorInfo);
  }

  componentDidUpdate(prevProps: OverlayErrorBoundaryProps) {
    const { resetKeys } = this.props;
    if (
      this.state.hasError &&
      shallowArrayChanged(prevProps.resetKeys, resetKeys)
    ) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, fallbackRender, overlayId } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallbackRender && error) {
      return fallbackRender({ error, resetError: this.reset });
    }

    if (fallback) {
      return fallback;
    }

    // Default fallback UI
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "rgba(220, 38, 38, 0.1)",
          border: "2px solid rgba(220, 38, 38, 0.5)",
          borderRadius: 8,
          color: "#dc2626",
        }}
      >
        <AlertTriangle size={20} style={{ marginRight: 8 }} />
        <div>
          <div style={{ fontWeight: 600 }}>Overlay Error ({overlayId})</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {error?.message || "An error occurred"}
          </div>
        </div>
      </div>
    );
  }
}
