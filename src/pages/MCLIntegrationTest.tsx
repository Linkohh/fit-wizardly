
import React, { useState } from 'react';
import { MuscleSelector } from '@/features/mcl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MCLIntegrationTest() {
    const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
    const [lastClickedMuscle, setLastClickedMuscle] = useState<string | null>(null);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">MCL Integration Test</h1>
                    <p className="text-muted-foreground">Verifying the Muscle Selector Component in FitWizard</p>
                </div>
                <Button onClick={() => setSelectedMuscles([])} variant="outline">Clear Selection</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 glass-card">
                    <CardContent className="p-6 h-[600px]">
                        <MuscleSelector
                            selectedMuscles={selectedMuscles}
                            onSelectionChange={setSelectedMuscles}
                            onMuscleClick={(muscle) => setLastClickedMuscle(muscle.name)}
                            theme="system"
                            showPresets={true}
                            height="100%"
                        />
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Selection State</CardTitle>
                            <CardDescription>Current component state</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Last Clicked</h4>
                                    <p className="text-primary">{lastClickedMuscle || 'None'}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Selected ({selectedMuscles.length})</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMuscles.length === 0 ? (
                                            <span className="text-muted-foreground italic text-sm">No muscles selected</span>
                                        ) : (
                                            selectedMuscles.map(id => (
                                                <span key={id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                                                    {id}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
