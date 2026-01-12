import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientsPage() {
    const navigate = useNavigate();

    return (
        <main className="container max-w-4xl mx-auto px-4 py-12">
            <EmptyState
                icon={Users}
                title="Client Management Coming Soon"
                description="We're building powerful tools to help you manage clients, track their progress, and scale your training business. In the meantime, explore Accountability Circles to connect with your community!"
                action={{
                    label: "Explore Circles",
                    onClick: () => navigate('/circles'),
                    variant: 'gradient'
                }}
                secondaryAction={{
                    label: "Back to Dashboard",
                    onClick: () => navigate('/')
                }}
            />
        </main>
    );
}
