/**
 * Circle Settings Tab
 *
 * Admin-only settings for circle management.
 * TODO: Implement in Phase 5
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Copy, Check, Trash2, AlertTriangle } from 'lucide-react';
import { useCircle } from '../CircleContext';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCircleStore } from '@/stores/circleStore';

export function CircleSettingsTab() {
    const { circle, isAdmin } = useCircle();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { leaveCircle } = useCircleStore();

    const [copied, setCopied] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    // Redirect if not admin
    if (!isAdmin) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Admin Only</h3>
                    <p className="text-muted-foreground">
                        Only circle admins can access settings.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const copyInviteCode = () => {
        if (circle?.invite_code) {
            navigator.clipboard.writeText(circle.invite_code);
            setCopied(true);
            toast({
                title: 'Invite code copied!',
                description: 'Share this code with friends to invite them.',
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLeaveCircle = async () => {
        if (!confirm('Are you sure you want to leave this circle? This action cannot be undone.')) {
            return;
        }

        setIsLeaving(true);
        await leaveCircle(circle.id);
        toast({
            title: 'Left circle',
            description: `You have left ${circle.name}`,
        });
        navigate('/circles');
    };

    return (
        <div className="space-y-6">
            {/* Circle Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Circle Settings
                    </CardTitle>
                    <CardDescription>
                        Manage your circle's details and members
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Circle Name</Label>
                        <Input
                            id="name"
                            value={circle.name}
                            disabled
                            className="max-w-md"
                        />
                        <p className="text-xs text-muted-foreground">
                            Circle name editing coming soon
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={circle.description || ''}
                            disabled
                            className="max-w-md"
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            Description editing coming soon
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Invite Code</Label>
                        <div className="flex gap-2 max-w-md">
                            <Input
                                value={circle.invite_code || ''}
                                readOnly
                                className="font-mono tracking-wider"
                            />
                            <Button variant="outline" onClick={copyInviteCode}>
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Share this code to invite new members
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                        <div>
                            <h4 className="font-medium">Leave Circle</h4>
                            <p className="text-sm text-muted-foreground">
                                Leave this circle permanently. This action cannot be undone.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleLeaveCircle}
                            disabled={isLeaving}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isLeaving ? 'Leaving...' : 'Leave Circle'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
