import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ClientsPage() {
    return (
        <div className="container px-4 py-8 mx-auto animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-lg bg-primary/10">
                    <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">Manage your clients and their workout plans</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder for client list */}
                <Card>
                    <CardHeader>
                        <CardTitle>Total Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">Active clients</p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12 text-center p-12 border rounded-lg bg-secondary/10 border-dashed">
                <p className="text-muted-foreground">Client management features coming soon</p>
            </div>
        </div>
    );
}
