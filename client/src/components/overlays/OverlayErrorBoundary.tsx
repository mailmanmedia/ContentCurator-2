import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface OverlayErrorBoundaryProps {
  children: ReactNode;
  overlayId: string;
  fallback?: ReactNode;
}

interface OverlayErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class OverlayErrorBoundary extends Component<OverlayErrorBoundaryProps, OverlayErrorBoundaryState> {
  constructor(props: OverlayErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): OverlayErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[OverlayErrorBoundary] Error in overlay "${this.props.overlayId}":`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      overlayId: this.props.overlayId,
    });
  }

  resetError = (): void => {
    console.log(`[OverlayErrorBoundary] Resetting error for overlay "${this.props.overlayId}"`);
    this.setState({
      hasError: false,
      error: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          data-testid={`error-overlay-${this.props.overlayId}`}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(17, 17, 17, 0.95)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            gap: '12px',
            color: '#FFFFFF',
            fontFamily: 'League Spartan, sans-serif',
          }}
        >
          <AlertTriangle
            data-testid="icon-error-alert"
            size={48}
            color="#EF4444"
            strokeWidth={2}
          />
          <div
            data-testid="text-error-title"
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#EF4444',
              textAlign: 'center',
            }}
          >
            Overlay Error
          </div>
          {this.state.error && (
            <div
              data-testid="text-error-message"
              style={{
                fontSize: '14px',
                color: '#D1D5DB',
                textAlign: 'center',
                maxWidth: '400px',
                wordWrap: 'break-word',
              }}
            >
              {this.state.error.message}
            </div>
          )}
          <button
            data-testid="button-retry-overlay"
            onClick={this.resetError}
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              fontFamily: 'League Spartan, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#DC2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#EF4444';
            }}
          >
            Try Again
          </button>
          <div
            data-testid="text-overlay-id"
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#6B7280',
              opacity: 0.7,
            }}
          >
            Overlay ID: {this.props.overlayId}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default OverlayErrorBoundary;
