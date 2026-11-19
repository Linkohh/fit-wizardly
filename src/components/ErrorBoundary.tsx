import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { devLog } from '@/lib/devLog';
import { captureError } from '@/lib/monitoring';

export interface ErrorFallbackProps {
    error?: Error;
    /** Clears the boundary so its children render again. */
    reset: () => void;
}

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    /** Renders a fallback that can reset the boundary. Takes precedence over `fallback`. */
    renderFallback?: (props: ErrorFallbackProps) => ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

// Sends to Sentry when crash reporting is on (contract #8), otherwise logs to the console.
function logErrorToService(error: Error, errorInfo: ErrorInfo) {
    captureError(error, { componentStack: errorInfo.componentStack ?? '' });
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.renderFallback) {
                return this.props.renderFallback({ error: this.state.error, reset: this.handleReset });
            }

            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <Card className="max-w-md w-full border-destructive/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                            <CardTitle className="text-destructive">Something went wrong</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-muted-foreground">
                                We encountered an unexpected error. Please try refreshing the page.
                            </p>

                            {import.meta.env.DEV && this.state.error && (
                                <details className="text-left text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                                    <summary className="cursor-pointer font-medium">Error details</summary>
                                    <pre className="mt-2 whitespace-pre-wrap">
                                        {this.state.error.message}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}

                            <div className="flex gap-2 justify-center">
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh Page
                                </Button>
                                <Button onClick={this.handleReset}>
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook for programmatic error logging
export function logError(error: Error, context?: Record<string, unknown>) {
    console.error('[App Error]', error, context);

    // Track with analytics
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
        devLog('[Error Logged]', { error: error.message, context });
    }
}
