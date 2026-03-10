import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "framer-motion"; // Добавляем для анимации
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import { FileJson, Sparkles, AlignLeft, Pencil, BookOpen, AlertCircle } from "lucide-react";
import { type NoteDetailsDto, type NoteStatus } from "@/modules/notes";

type ViewMode = 'raw' | 'structured' | 'summary' | 'error';

const StatusBadge = ({ status }: { status: NoteStatus }) => {
    const styles = {
        'Pending': 'text-muted-foreground bg-muted/50 border-muted/50',
        'Failed': 'text-red-700 bg-red-50 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
        'Raw': 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
        'Structured': 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/50',
        'Summarized': 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50',
    }[status] || 'text-muted-foreground bg-muted border-transparent';

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 h-8 text-[11px] font-medium rounded-md border select-none transition-colors",
            styles
        )}>
            {status}
        </span>
    );
};

interface NoteToolbarProps {
    note: NoteDetailsDto;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    isEditing: boolean;
    toggleEditMode: () => void;
}

export const NoteToolbar = ({ note, viewMode, setViewMode, isEditing, toggleEditMode }: NoteToolbarProps) => {
    const availableModes: { id: ViewMode; label: string; icon: any }[] = [];

    if (note.status === 'Failed') {
        availableModes.push({ id: 'error', label: 'Error', icon: AlertCircle });
    }
    availableModes.push(
        { id: 'raw', label: 'Raw', icon: AlignLeft },
        { id: 'structured', label: 'Structured', icon: FileJson },
        { id: 'summary', label: 'Summary', icon: Sparkles }
    );

    return (
        <div className="h-10 border-b border-border bg-background flex items-center justify-between px-4 flex-shrink-0 select-none">
            <div className="flex items-center gap-3">
                <StatusBadge status={note.status} />
                <span className="text-[11px] text-muted-foreground/70 font-normal">
                    {format(new Date(note.updatedAt || note.createdAt), "d MMM yyyy, HH:mm", { locale: ru })}
                </span>
            </div>

            <div className="flex items-center gap-2">
                {/* SLIDE SWITCH CONTAINER */}
                <div className="relative flex p-1 bg-muted/50 rounded-lg border border-border/40 h-8 items-center">
                    {availableModes.map((mode) => {
                        const Icon = mode.icon;
                        const isActive = viewMode === mode.id;
                        const isError = mode.id === 'error';

                        return (
                            <button
                                key={mode.id}
                                onClick={() => setViewMode(mode.id)}
                                className={cn(
                                    "relative flex items-center gap-1.5 px-3 h-6 text-[11px] font-medium transition-colors duration-300",
                                    isActive
                                        ? (isError ? "text-red-700 dark:text-red-300" : "text-foreground")
                                        : (isError ? "text-red-600/50 hover:text-red-600" : "text-muted-foreground/80 hover:text-foreground")
                                )}
                            >
                                {/* ПЛАВАЮЩИЙ ПОЛЗУНОК */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className={cn(
                                            "absolute inset-0 rounded-md shadow-sm border border-border/20",
                                            isError ? "bg-red-100 dark:bg-red-900/50" : "bg-background"
                                        )}
                                        transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                                    />
                                )}

                                {/* ТЕКСТ И ИКОНКА (поверх ползунка) */}
                                <span className="relative z-10 flex items-center gap-1.5">
                                    <Icon className="h-3.5 w-3.5" />
                                    <span>{mode.label}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>

                <Separator orientation="vertical" className="h-4 mx-1 opacity-50" />

                <Button
                    variant="ghost"
                    size="sm"
                    disabled={viewMode === 'error'}
                    className={cn(
                        "h-8 w-8 p-0 rounded-md transition-colors",
                        isEditing ? "text-primary bg-primary/5" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted",
                    )}
                    onClick={toggleEditMode}
                >
                    {isEditing ? <BookOpen className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
};