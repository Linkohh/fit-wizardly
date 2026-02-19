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
import { ClientProgress } from '@/components/trainer/ClientProgress';
import { ClientMessages } from '@/components/trainer/ClientMessages';

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
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-muted-foreground">Client not found.</p>
                <Button onClick={() => navigate('/clients')}>Return to Clients</Button>
            </div>
        );
    }

    const handleUnassign = (assignmentId: string) => {
        if (confirm('Are you sure you want to unassign this plan?')) {
            unassignPlan(assignmentId);
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this client?')) {
            deleteClient(client!.id);
            navigate('/clients');
        }
    };

    return (
        <main className="flex-1 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.displayName}`} />
                            <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{client.displayName}</h2>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(client.createdAt), 'MMMM yyyy')}
                                <span className="text-muted-foreground/30">•</span>
                                <MapPin className="h-4 w-4" />
                                Online
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AssignPlanDialog clientId={client.id} clientName={client.displayName} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                                Delete Client
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="plans">Plans</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="messages" className="hidden sm:inline-flex">Messages</TabsTrigger>
                    <TabsTrigger value="messages" className="sm:hidden"><Mail className="h-4 w-4" /></TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Client Assessment Card (New) */}
                        <Card className="md:col-span-2 lg:col-span-3 border-primary/20 bg-primary/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    Client Assessment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Age / Weight</p>
                                        <p className="text-lg font-medium">28 / 185 lbs</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Primary Goal</p>
                                        <p className="text-lg font-medium capitalize">{client.notes?.includes('Hypertrophy') ? 'Hypertrophy' : 'Strength'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Experience</p>
                                        <p className="text-lg font-medium">Intermediate</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Injuries</p>
                                        <p className="text-lg font-medium text-emerald-500">None Reported</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

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

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Workouts Completed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold">12</p>
                                    <p className="text-xs text-muted-foreground">In the last 30 days</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Latest Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                    {client.notes || "No notes added."}
                                </p>
                            </CardContent>
                        </Card>
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
                    <ClientProgress />
                </TabsContent>

                <TabsContent value="messages">
                    <ClientMessages clientId={client.id} />
                </TabsContent>
            </Tabs >
        </main >
    );
}
