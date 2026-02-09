import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    User,
    Settings,
    Moon,
    Sun,
    Monitor,
    Volume2,
    VolumeX,
    Vibrate,
    VibrateOff,
    Dumbbell,
    Trash2,
    Download,
    Shield,
    ChevronRight,
    LogOut,
    Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useThemeStore } from '@/stores/themeStore';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { useTrainerStore } from '@/stores/trainerStore';
import { usePlanStore } from '@/stores/planStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function Profile() {
    const { t, i18n } = useTranslation();

    // Theme Store
    const { mode, setMode } = useThemeStore();

    // Preferences Store
    const { settings, updateSettings } = usePreferencesStore();

    // Trainer Store
    const { isTrainerMode, toggleTrainerMode } = useTrainerStore();

    // Plan/Fitness Store
    const { preferredWeightUnit, setPreferredWeightUnit } = usePlanStore();

    // Auth Store
    const { user, signOut } = useAuthStore();

    const handleExportData = () => {
        try {
            const data = {
                settings,
                planHistory: usePlanStore.getState().planHistory,
                workoutLogs: usePlanStore.getState().workoutLogs,
                personalRecords: usePlanStore.getState().personalRecords,
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fitwizard-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(t('profile.export_success', 'Data exported successfully'));
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(t('profile.export_error', 'Failed to export data'));
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 bg-background">
            <div className="container max-w-2xl mx-auto space-y-6">

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-background shadow-xl overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-10 w-10 text-primary" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{user?.user_metadata?.full_name || 'Guest User'}</h1>
                        <p className="text-muted-foreground">{user?.email || 'Local Account'}</p>
                    </div>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    {/* App Settings */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-primary" />
                                    {t('profile.app_settings', 'App Settings')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* Theme */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t('header.theme.label', 'Theme')}</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light'}
                                        </p>
                                    </div>
                                    <div className="flex bg-secondary rounded-lg p-1">
                                        <Button
                                            variant={mode === 'light' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setMode('light')}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Sun className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={mode === 'dark' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setMode('dark')}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Moon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={mode === 'system' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setMode('system')}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Monitor className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                {/* Language */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Language</Label>
                                        <p className="text-sm text-muted-foreground">{i18n.language.toUpperCase()}</p>
                                    </div>
                                    <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Select Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                            <SelectItem value="fr">Français</SelectItem>
                                            <SelectItem value="de">Deutsch</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                {/* Sound & Haptics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {settings.sounds ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                                            <Label htmlFor="sounds">Sound Effects</Label>
                                        </div>
                                        <Switch
                                            id="sounds"
                                            checked={settings.sounds !== false}
                                            onCheckedChange={(checked) => updateSettings({ sounds: checked, soundsExplicitlySet: true })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {settings.haptics ? <Vibrate className="h-4 w-4" /> : <VibrateOff className="h-4 w-4 text-muted-foreground" />}
                                            <Label htmlFor="haptics">Haptics</Label>
                                        </div>
                                        <Switch
                                            id="haptics"
                                            checked={settings.haptics !== false}
                                            onCheckedChange={(checked) => updateSettings({ haptics: checked })}
                                        />
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Fitness Preferences */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Dumbbell className="h-5 w-5 text-primary" />
                                    {t('profile.fitness_prefs', 'Fitness Preferences')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* Weight Unit */}
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">Weight Unit</Label>
                                    <div className="flex bg-secondary rounded-lg p-1">
                                        <Button
                                            variant={preferredWeightUnit === 'lbs' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setPreferredWeightUnit('lbs')}
                                            className="px-4"
                                        >
                                            LBS
                                        </Button>
                                        <Button
                                            variant={preferredWeightUnit === 'kg' ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setPreferredWeightUnit('kg')}
                                            className="px-4"
                                        >
                                            KG
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                {/* Trainer Mode */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t('header.trainer_mode', 'Trainer Mode')}</Label>
                                        <p className="text-sm text-muted-foreground">Manage clients and plans</p>
                                    </div>
                                    <Switch
                                        checked={isTrainerMode}
                                        onCheckedChange={toggleTrainerMode}
                                    />
                                </div>

                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Data & Privacy */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">

                                <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                    onClick={handleExportData}
                                >
                                    <span className="flex items-center gap-2">
                                        <Download className="h-4 w-4" />
                                        Export Data (JSON)
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </Button>

                                {/* FUTURE: Add Delete Account here */}
                                {/* <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button> */}

                                <div className="pt-2 flex justify-center">
                                    <p className="text-xs text-muted-foreground">App Version 1.2.0 • Build 2026.02</p>
                                </div>

                            </CardContent>
                        </Card>
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
}
