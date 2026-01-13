import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Users, Plus, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

export function CoachImportStep() {
    const [isDragging, setIsDragging] = useState(false);
    const [importedCount, setImportedCount] = useState(0);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        // Simulate import - in production, parse CSV
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Simulate successful import
            setImportedCount(5); // Placeholder
        }
    }, []);

    const handleFileSelect = useCallback(() => {
        // Simulate file picker - in production, use input[type=file]
        setImportedCount(3); // Placeholder
    }, []);

    return (
        <div className="space-y-8 text-center">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary mb-4">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Coach Feature</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                    Import your clients
                </h1>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Get a head start by importing your existing client list. You can also add clients manually later.
                </p>
            </motion.div>

            {/* Import zone */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <Card
                    className={cn(
                        "relative transition-all duration-300 cursor-pointer",
                        isDragging
                            ? "border-primary border-2 bg-primary/5 scale-[1.02]"
                            : "border-dashed border-2 border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleFileSelect}
                >
                    <CardContent className="p-8 space-y-4">
                        <motion.div
                            animate={{
                                y: isDragging ? -5 : 0,
                                scale: isDragging ? 1.1 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 400 }}
                            className={cn(
                                "mx-auto w-16 h-16 rounded-full flex items-center justify-center",
                                isDragging ? "bg-primary/20" : "bg-muted"
                            )}
                        >
                            <Upload className={cn(
                                "h-8 w-8",
                                isDragging ? "text-primary" : "text-muted-foreground"
                            )} />
                        </motion.div>

                        <div>
                            <p className="font-medium text-foreground">
                                {isDragging ? 'Drop your file here' : 'Drag & drop a CSV file'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                or click to browse files
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>Supports: CSV with columns (name, email, notes)</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Import success indicator */}
            {importedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-success"
                >
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                        {importedCount} client{importedCount !== 1 ? 's' : ''} ready to import
                    </span>
                </motion.div>
            )}

            {/* OR divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        or start fresh
                    </span>
                </div>
            </div>

            {/* Manual add button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <Button variant="outline" size="lg" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Clients Manually Later
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                    You can add clients anytime from the Clients page
                </p>
            </motion.div>
        </div>
    );
}
