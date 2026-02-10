import { useState } from "react";
import { useTrainerStore } from "@/stores/trainerStore";
import { ClientCard } from "@/components/trainer/ClientCard";
import { AddClientDialog } from "@/components/trainer/AddClientDialog";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";

export default function ClientsPage() {
    const navigate = useNavigate();
    const { clients } = useTrainerStore();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredClients = clients.filter(client =>
        client.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your athletes and assign training plans.
                    </p>
                </div>
                <AddClientDialog />
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 max-w-md"
                />
            </div>

            {clients.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No clients yet"
                    description="Get started by adding your first client to the portal."
                    action={{
                        label: "Add Client",
                        onClick: () => document.querySelector<HTMLButtonElement>('[data-trigger="add-client"]')?.click(), // Hacky trigger or just rely on the main button
                        variant: 'default'
                    }}
                />
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No clients found matching "{searchQuery}"
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onClick={() => navigate(`/clients/${client.id}`)}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
