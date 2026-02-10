import { useParams, useNavigate } from 'react-router-dom';
import { AssignPlanDialog } from '@/components/trainer/AssignPlanDialog';
import { useTrainerStore } from '@/stores/trainerStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Calendar, Dumbbell, LineChart, Mail, MapPin, MoreVertical, Plus, User } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';

export default function ClientDetails() {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const { getClient, deleteClient, getClientAssignments, getTemplate, unassignPlan } = useTrainerStore();

    const client = getClient(clientId || '');
    const assignments = client ? getClientAssignments(client.id) : [];

    // Get the most recent active assignment for the Overview card
    const activeAssignment = assignments.length > 0
        ? { ...assignments[assignments.length - 1], template: getTemplate(assignments[assignments.length - 1].planId) }
        : null;

    if (!client) {
        // ... existing not found check ...
    }

    const handleUnassign = (assignmentId: string) => {
        if (confirm('Are you sure you want to unassign this plan?')) {
            unassignPlan(assignmentId);
        }
    };

    // ... existing handleDelete ...

    return (
// ... existing header ...

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Active Plan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activeAssignment && activeAssignment.template ? (
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold truncate">{activeAssignment.template.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Assigned {format(new Date(activeAssignment.assignedAt), 'MMM d')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground text-sm">No active plan</div>
                                )}
                            </CardContent>
                        </Card>
// ... existing stats cards ...
                    </div>
                </TabsContent>

                <TabsContent value="plans" className="space-y-4">
                    {assignments.length === 0 ? (
                         <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/5">
                            <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                            <h3 className="text-lg font-medium">No Plans Assigned</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Assign a template to get {client.displayName} started.
                            </p>
                            <AssignPlanDialog 
                                clientId={client.id} 
                                clientName={client.displayName} 
                            />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {assignments.map((assignment) => {
                                const template = getTemplate(assignment.planId);
                                if (!template) return null;
                                return (
                                    <Card key={assignment.id} className="flex flex-row items-center justify-between p-4 bg-muted/5">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-2 rounded-full">
                                                <Dumbbell className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{template.name}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    Assigned on {format(new Date(assignment.assignedAt), 'PPP')}
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleUnassign(assignment.id)}
                                        >
                                            Unassign
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="progress">
                    <EmptyState
                        icon={LineChart}
                        title="Progress Tracking Coming Soon"
                        description="Charts and stats for client lifts and body measurements will appear here."
                    />
                </TabsContent>
            </Tabs >
        </main >
    );
}
