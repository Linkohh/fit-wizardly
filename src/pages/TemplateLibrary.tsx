import { useState } from 'react';
import { useTrainerStore } from '@/stores/trainerStore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Dumbbell, Calendar, Clock, MoreVertical, Trash2, Copy, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function TemplateLibrary() {
    const { templates, deleteTemplate } = useTrainerStore();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            deleteTemplate(id);
        }
    };

    return (
        <main className="flex-1 p-8 pt-6 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Template Library</h2>
                    <p className="text-muted-foreground">Manage your training plan templates.</p>
                </div>
                <Button className="gradient-primary">
                    <Plus className="mr-2 h-4 w-4" /> Create Template
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search templates..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Templates</TabsTrigger>
                    <TabsTrigger value="strength">Strength</TabsTrigger>
                    <TabsTrigger value="hypertrophy">Hypertrophy</TabsTrigger>
                    <TabsTrigger value="endurance">Endurance</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {filteredTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg bg-muted/5 p-8 text-center animate-in fade-in-50">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Copy className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
                            <p className="mb-4 text-sm text-muted-foreground max-w-sm mx-auto">
                                You haven't created any templates yet. Save a plan as a template or create one from scratch.
                            </p>
                            <Button variant="outline">Create New Template</Button>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredTemplates.map((template) => (
                                <Card key={template.id} className="group relative transition-all hover:bg-muted/5 hover:border-primary/50">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="bg-primary/10 p-2 rounded-md mb-2">
                                                <Dumbbell className="h-5 w-5 text-primary" />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { }}>
                                                        Edit Template
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(template.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardTitle className="line-clamp-1">{template.name}</CardTitle>
                                        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                            {template.planSnapshot.splitType.replace('_', ' ')} split • {template.planSnapshot.workoutDays.length} days/week
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {template.tags.slice(0, 3).map(tag => (
                                                <Badge key={tag} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {template.tags.length > 3 && (
                                                <Badge variant="secondary" className="text-xs">+{template.tags.length - 3}</Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="text-xs text-muted-foreground border-t bg-muted/20 p-3 flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            45-60m
                                        </span>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
                {/* Other tabs can just filter the list naturally or by API in real app */}
            </Tabs>
        </main>
    );
}
