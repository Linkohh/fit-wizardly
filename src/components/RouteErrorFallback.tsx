import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import type { ErrorFallbackProps } from '@/components/ErrorBoundary';

/**
 * Compact fallback for a single route: the header and the rest of the shell stay usable.
 * Must render inside a router (it uses useNavigate).
 */
export function RouteErrorFallback({ reset }: ErrorFallbackProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const goHome = () => {
        reset();
        navigate('/');
    };

    return (
        <div role="alert" className="flex items-center justify-center p-6 min-h-[50vh]">
            <Card className="max-w-sm w-full border-destructive/40">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg">
                        {t('errors.route.title', 'This page hit a problem.')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t('errors.route.description', 'The rest of the app still works. Try again, or go back home.')}
                    </p>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={goHome}>
                            <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                            {t('errors.route.go_home', 'Go home')}
                        </Button>
                        <Button onClick={reset}>
                            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                            {t('errors.route.try_again', 'Try again')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
