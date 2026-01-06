'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface BisectControlsProps {
    onGood: () => void;
    onBad: () => void;
    onReset: () => void;
    status: string;
    loading: boolean;
}

export default function BisectControls({ onGood, onBad, onReset, status, loading }: BisectControlsProps) {
    return (
        <Card className="rounded-none border-x-0 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-bold flex justify-between items-center text-blue-700 dark:text-blue-300">
                    <span>Git Bisect in Progress</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={onReset} title="Abort Bisect">
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                </CardTitle>
                <CardDescription className="text-xs truncate" title={status}>
                    {status || "Testing current revision..."}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex gap-2">
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-100 dark:hover:bg-green-900/30"
                    onClick={onGood}
                    disabled={loading}
                >
                    <CheckCircle className="w-4 h-4 mr-1" /> Good
                </Button>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-100 dark:hover:bg-red-900/30"
                    onClick={onBad}
                    disabled={loading}
                >
                    <XCircle className="w-4 h-4 mr-1" /> Bad
                </Button>
            </CardContent>
        </Card>
    );
}
