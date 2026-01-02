import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Scale, Lock, FileText } from "lucide-react";

export default function LegalPage() {
    return (
        <div className="container max-w-4xl mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 gradient-text">Legal & Compliance</h1>

            <Tabs defaultValue="disclaimer" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
                    <TabsTrigger value="disclaimer" className="py-3">
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Medical Disclaimer
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="py-3">
                        <Lock className="w-4 h-4 mr-2" />
                        Privacy Policy
                    </TabsTrigger>
                    <TabsTrigger value="terms" className="py-3">
                        <Scale className="w-4 h-4 mr-2" />
                        Terms of Service
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="disclaimer">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-destructive">
                                    <ShieldAlert className="w-6 h-6 mr-2" />
                                    Medical Disclaimer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert variant="destructive">
                                    <ShieldAlert className="h-4 w-4" />
                                    <AlertTitle>Critical Warning</AlertTitle>
                                    <AlertDescription>
                                        FitWizard is NOT a doctor. The generated workouts are for educational purposes only.
                                    </AlertDescription>
                                </Alert>

                                <div className="prose dark:prose-invert max-w-none">
                                    <p>
                                        The content provided by FitWizard, including workout plans, nutritional suggestions, and chat responses,
                                        is for <strong>educational and entertainment purposes only</strong> and is <strong>not intended as medical advice</strong>.
                                    </p>
                                    <p>
                                        You should consult with a physician or other healthcare professional before starting this or any other fitness program
                                        to determine if it is right for your needs. This is particularly true if you (or your family) have a history of high blood pressure or heart disease,
                                        or if you have ever experienced chest pain when exercising or have experienced chest pain in the past month when not engaged in physical activity,
                                        smoke, have high cholesterol, are obese, or have a bone or joint problem that could be made worse by a change in physical activity.
                                    </p>
                                    <p className="font-bold">
                                        If you experience faintness, dizziness, pain, or shortness of breath at any time while exercising, you should stop immediately.
                                    </p>
                                    <p>
                                        Do not rely on this application for medical diagnosis or treatment. The use of any information provided on this site is solely at your own risk.
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
                                    Local-First Privacy Policy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <DatabaseIcon className="h-4 w-4" />
                                    <AlertTitle>Your Data Stays Here</AlertTitle>
                                    <AlertDescription>
                                        We do not store your health data on our servers. It lives 100% on your device.
                                    </AlertDescription>
                                </Alert>

                                <div className="prose dark:prose-invert max-w-none">
                                    <h3>1. Data Storage</h3>
                                    <p>
                                        FitWizard operates as a "Local-First" application. All personal health data, workout plans, preferences, and progress logs
                                        are stored exclusively on your local device (specifically, in your browser's LocalStorage).
                                    </p>

                                    <h3>2. Data Transmission</h3>
                                    <p>
                                        We do not transmit, store, or sell your personal health data to any central server or third party.
                                        The only data transmitted is anonymous usage analytics (if opted in) and efficient API calls to generate content,
                                        which are stateless and do not retain your personal profile.
                                    </p>

                                    <h3>3. Data Loss Risk</h3>
                                    <p>
                                        <strong>Warning:</strong> Because data is stored locally, clearing your browser cache or uninstalling the browser
                                        will result in the permanent loss of your workout plans and history. We recommend manually exporting your plans as PDF
                                        if you wish to keep a backup.
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
                                    Terms of Service
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="prose dark:prose-invert max-w-none">
                                    <h3>1. Acceptance of Terms</h3>
                                    <p>
                                        By accessing or using FitWizard, you agree to be bound by these Terms. If you disagree with any part of the terms,
                                        you may not access the service.
                                    </p>

                                    <h3>2. "As-Is" Warranty</h3>
                                    <p className="uppercase text-sm font-mono bg-muted p-4 rounded-md">
                                        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
                                        THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                                        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
                                        TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                                    </p>

                                    <h3>3. User Responsibility</h3>
                                    <p>
                                        You are solely responsible for ensuring that any exercise or activity you perform is safe for your physical condition.
                                        FitWizard assumes no liability for injuries occurring while performing exercises suggested by the application.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            <div className="mt-12 text-center text-sm text-muted-foreground pb-8">
                <p>© {new Date().getFullYear()} FitWizard. All rights reserved.</p>
                <p>Generated plans are for educational purposes only.</p>
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
