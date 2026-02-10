import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrengthCurve } from '@/components/analytics/StrengthCurve';
import { VolumeHealth } from '@/components/analytics/VolumeHealth';
import { SplitRecommender } from '@/components/wizards/SplitRecommender';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';

export default function Analytics() {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8 pb-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-3xl font-bold tracking-tight gradient-text">Analytics & Intelligence</h1>
                <p className="text-muted-foreground">Deep dive into your training data and recovery metrics.</p>
            </motion.div>

            <Tabs defaultValue="performance" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="volume">Volume & Health</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                        <StrengthCurve />
                        {/* Placeholder for future analytics */}
                        <Card variant="glass" className="flex items-center justify-center p-6 text-muted-foreground border-dashed">
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>More performance metrics coming soon...</p>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="volume" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                        <VolumeHealth />
                        {/* Placeholder for future analytics */}
                        <Card variant="glass" className="flex items-center justify-center p-6 text-muted-foreground border-dashed">
                            <div className="text-center">
                                <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Recovery insights coming soon...</p>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
