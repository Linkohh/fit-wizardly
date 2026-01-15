import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Scale, Lock, FileText } from "lucide-react";

export default function LegalPage() {
    const { t } = useTranslation();

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 gradient-text">{t('legal.page_title')}</h1>

            <Tabs defaultValue="disclaimer" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
                    <TabsTrigger value="disclaimer" className="py-3">
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        {t('legal.tabs.medical')}
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="py-3">
                        <Lock className="w-4 h-4 mr-2" />
                        {t('legal.tabs.privacy')}
                    </TabsTrigger>
                    <TabsTrigger value="terms" className="py-3">
                        <Scale className="w-4 h-4 mr-2" />
                        {t('legal.tabs.terms')}
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="disclaimer">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-destructive">
                                    <ShieldAlert className="w-6 h-6 mr-2" />
                                    {t('legal.medical.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert variant="destructive">
                                    <ShieldAlert className="h-4 w-4" />
                                    <AlertTitle>{t('legal.medical.warning_title')}</AlertTitle>
                                    <AlertDescription>
                                        {t('legal.medical.warning_text')}
                                    </AlertDescription>
                                </Alert>

                                <div className="prose dark:prose-invert max-w-none">
                                    <p>
                                        {t('legal.medical.content_p1')}
                                    </p>
                                    <p>
                                        {t('legal.medical.content_p2')}
                                    </p>
                                    <p className="font-bold">
                                        {t('legal.medical.content_p3')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-primary">
                                    <Lock className="w-6 h-6 mr-2" />
                                    {t('legal.privacy.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <DatabaseIcon className="h-4 w-4" />
                                    <AlertTitle>{t('legal.privacy.data_stays_title')}</AlertTitle>
                                    <AlertDescription>
                                        {t('legal.privacy.data_stays_text')}
                                    </AlertDescription>
                                </Alert>

                                <div className="prose dark:prose-invert max-w-none">
                                    <h3>{t('legal.privacy.what_we_store')}</h3>
                                    <p>
                                        {t('legal.privacy.what_we_store_text')}
                                    </p>

                                    <h3>{t('legal.privacy.analytics')}</h3>
                                    <p>
                                        {t('legal.privacy.analytics_text')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="terms">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="w-6 h-6 mr-2" />
                                    {t('legal.terms.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="prose dark:prose-invert max-w-none">
                                    <h3>{t('legal.terms.acceptance')}</h3>
                                    <p>
                                        {t('legal.terms.acceptance_text')}
                                    </p>

                                    <h3>{t('legal.terms.use')}</h3>
                                    <p>
                                        {t('legal.terms.use_text')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            <div className="mt-12 text-center text-sm text-muted-foreground pb-8">
                <p>© {new Date().getFullYear()} {t('legal.footer.copyright')}</p>
                <p>{t('legal.footer.educational')}</p>
            </div>
        </div>
    );
}

function DatabaseIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    );
}
