import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

// Log error to external service (stub for now)
function logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In production, send to Sentry, LogRocket, etc.
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Could send to external service here:
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify({ error, errorInfo }) })
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
        console.log('[Error Logged]', { error: error.message, context });
    }
}
