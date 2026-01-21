/**
 * Circle Tab Navigation
 *
 * Horizontal tab navigation for the Circle Portal.
 * Supports Feed, Leaderboard, Challenges, Members, and Settings (admin only) tabs.
 */

import { Link, useParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    Activity,
    Trophy,
    Target,
    Users,
    Settings,
} from 'lucide-react';

interface CircleTabNavProps {
    isAdmin: boolean;
}

const tabs = [
    { id: 'feed', label: 'Feed', icon: Activity },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'members', label: 'Members', icon: Users },
];

const adminTabs = [
    { id: 'settings', label: 'Settings', icon: Settings },
];

export function CircleTabNav({ isAdmin }: CircleTabNavProps) {
    const { circleId } = useParams<{ circleId: string }>();
    const location = useLocation();

    // Extract current tab from URL path
    const pathParts = location.pathname.split('/');
    const currentTab = pathParts[pathParts.length - 1] || 'feed';

    const allTabs = isAdmin ? [...tabs, ...adminTabs] : tabs;

    return (
        <nav className="border-b border-border mb-6">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {allTabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.id}
                            to={`/circles/${circleId}/${tab.id}`}
                            className={cn(
                                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                                isActive
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
