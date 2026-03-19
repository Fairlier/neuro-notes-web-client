import { useTranslation } from 'react-i18next';
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { enUS } from "date-fns/locale/en-US";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import { FileJson, FileChartColumnIncreasing, AlignLeft, Pencil, BookOpen, AlertCircle, type LucideIcon } from "lucide-react";
import { type NoteDetailsDto, type NoteStatus } from "@/modules/notes";

type ViewMode = 'raw' | 'structured' | 'summary' | 'error';

interface StatusBadgeProps {
    status: NoteStatus;
    label: string;
}

const StatusBadge = ({ status, label }: StatusBadgeProps) => {
    const styles = {
        'Pending': 'text-muted-foreground bg-muted/50 border-muted/50',
        'Failed': 'text-red-700 bg-red-50 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
        'Raw': 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
        'Structured': 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/50',
        'Summarized': 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50',
    }[status] || 'text-muted-foreground bg-muted border-transparent';

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 h-8 text-[11px] font-medium rounded-md border select-none transition-colors whitespace-nowrap flex-shrink-0",
            styles
        )}>
            {label}
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
    const { t, i18n } = useTranslation();

    // Функция форматирования даты с учётом локали
    const formatDate = (dateString: string) => {
        const locale = i18n.language === 'ru' ? ru : enUS;
        // Используем более читаемый формат для тулбара
        const dateFormat = i18n.language === 'ru' ? "d MMM yyyy, HH:mm" : "MMM d, yyyy, HH:mm";
        return format(new Date(dateString), dateFormat, { locale });
    };

    // Получение локализованного названия статуса
    const getStatusLabel = (status: NoteStatus) => t(`note.status.${status}`);

    // Получение локализованного названия режима просмотра
    const getViewModeLabel = (mode: ViewMode) => t(`note.viewMode.${mode}`);

    const availableModes: { id: ViewMode; icon: LucideIcon }[] = [];

    if (note.status === 'Failed') {
        availableModes.push({ id: 'error', icon: AlertCircle });
    }
    availableModes.push(
        { id: 'raw', icon: AlignLeft },
        { id: 'structured', icon: FileChartColumnIncreasing },
        { id: 'summary', icon: FileJson }
    );

    return (
        <div className="h-10 border-b border-border bg-background flex items-center justify-between px-4 flex-shrink-0 select-none min-w-0">
            {/* ЛЕВАЯ ЧАСТЬ: СТАТУС И ДАТА */}
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <StatusBadge status={note.status} label={getStatusLabel(note.status)} />

                <Separator orientation="vertical" className="h-4 mx-1 opacity-50 flex-shrink-0" />

                <span className="text-[11px] text-muted-foreground/70 font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                    {formatDate(note.updatedAt || note.createdAt)}
                </span>
            </div>

            {/* ПРАВАЯ ЧАСТЬ: ПЕРЕКЛЮЧАТЕЛЬ И РЕДАКТИРОВАНИЕ */}
            <div className="flex items-center gap-2 flex-shrink-0">
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
                                    "relative flex items-center gap-1.5 px-3 h-6 text-[11px] font-medium transition-colors duration-150 rounded-md whitespace-nowrap",
                                    isActive && (isError
                                        ? "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 shadow-sm border border-border/20"
                                        : "text-foreground bg-background shadow-sm border border-border/20"),
                                    !isActive && (isError
                                        ? "text-red-600/50 hover:text-red-600"
                                        : "text-muted-foreground/80 hover:text-foreground")
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{getViewModeLabel(mode.id)}</span>
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
                        "h-8 w-8 p-0 rounded-md transition-colors flex-shrink-0",
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