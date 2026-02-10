import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, CreditCard, Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '@/stores/themeStore';

const data = [
    { name: 'Jan', revenue: 400 },
    { name: 'Feb', revenue: 300 },
    { name: 'Mar', revenue: 200 },
    { name: 'Apr', revenue: 278 },
    { name: 'May', revenue: 189 },
    { name: 'Jun', revenue: 239 },
    { name: 'Jul', revenue: 349 },
];

export default function Revenue() {
    const { getEffectiveTheme } = useThemeStore();
    const theme = getEffectiveTheme();
    const isDark = theme === 'dark';

    return (
        <main className="container-wide py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight gradient-text">Revenue & Subscriptions</h1>
                    <p className="text-muted-foreground">Manage your earnings and billing settings.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="glass-card bg-background/50 hover:bg-background/80 transition-all">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Billing Settings
                    </Button>
                    <Button className="gradient-primary shadow-glow hover:scale-105 transition-transform duration-200">
                        <Lock className="mr-2 h-4 w-4" />
                        Upgrade to Pro
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card variant="glass" className="card-interactive">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-emerald-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card variant="glass" className="card-interactive animation-delay-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-emerald-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +180.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card variant="glass" className="card-interactive animation-delay-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12,234</div>
                        <p className="text-xs text-emerald-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +19% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card variant="glass" className="card-interactive animation-delay-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+573</div>
                        <p className="text-xs text-emerald-500 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +201 since last hour
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card variant="glass" className="col-span-4 animation-delay-500">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="hsl(var(--muted-foreground))"
                                        opacity={0.1}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card)/0.8)',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: 'var(--radius)',
                                            backdropFilter: 'blur(8px)',
                                            color: 'hsl(var(--foreground))'
                                        }}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="hsl(var(--primary))"
                                        radius={[4, 4, 0, 0]}
                                        className="fill-primary"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card variant="glass" className="col-span-3 animation-delay-700">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>
                            You made 265 sales this month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                            <div className="flex items-center group">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-4 group-hover:scale-110 transition-transform">
                                    OM
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Olivia Martin</p>
                                    <p className="text-sm text-muted-foreground">
                                        olivia.martin@email.com
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-emerald-500">+$1,999.00</div>
                            </div>
                            <div className="flex items-center group">
                                <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold mr-4 group-hover:scale-110 transition-transform">
                                    JL
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Jackson Lee</p>
                                    <p className="text-sm text-muted-foreground">jackson.lee@email.com</p>
                                </div>
                                <div className="ml-auto font-medium">+$39.00</div>
                            </div>
                            <div className="flex items-center group">
                                <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold mr-4 group-hover:scale-110 transition-transform">
                                    IN
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Isabella Nguyen</p>
                                    <p className="text-sm text-muted-foreground">
                                        isabella.nguyen@email.com
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">+$299.00</div>
                            </div>
                            <div className="flex items-center group">
                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold mr-4 group-hover:scale-110 transition-transform">
                                    WK
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">William Kim</p>
                                    <p className="text-sm text-muted-foreground">will@email.com</p>
                                </div>
                                <div className="ml-auto font-medium">+$99.00</div>
                            </div>
                            <div className="flex items-center group">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-4 group-hover:scale-110 transition-transform">
                                    SD
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Sofia Davis</p>
                                    <p className="text-sm text-muted-foreground">sofia.davis@email.com</p>
                                </div>
                                <div className="ml-auto font-medium">+$39.00</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="gradient-subtle border rounded-2xl p-8 text-center space-y-4 relative overflow-hidden shadow-lg animate-in zoom-in-95 duration-700 delay-300">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] z-0"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Unlock Pro Features</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Get access to advanced analytics, unlimited clients, white-labeling, and more. Upgrade your trainer account today.
                    </p>
                    <div className="pt-4">
                        <Button size="lg" className="gradient-primary shadow-glow-pink hover:scale-105 transition-all duration-300">
                            Upgrade Now
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
