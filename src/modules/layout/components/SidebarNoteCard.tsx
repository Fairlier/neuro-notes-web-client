import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, FileAudio, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import type { NoteListItemDto } from "@/modules/notes/types/notesTypes";

interface SidebarNoteCardProps {
    note: NoteListItemDto;
    isActive: boolean;
    onClick: (e: React.MouseEvent, noteId: string, noteTitle: string) => void;
}

export const SidebarNoteCard = ({ note, isActive, onClick }: SidebarNoteCardProps) => {
    const dateToUse = note.updatedAt ? new Date(note.updatedAt) : new Date(note.createdAt);
    const isAudio = note.sourceType === 'AudioFile';

    return (
        <Button
            variant="ghost"
            onClick={(e) => onClick(e, note.id, note.title)}
            className={cn(
                "w-full max-w-full h-auto py-2.5 px-3 flex flex-col items-start gap-1.5 text-left font-normal rounded-lg transition-none overflow-hidden border",
                isActive
                    ? "bg-background text-foreground shadow-sm border-border"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground border-transparent"
            )}
        >
            {/* 1 Строка: Заголовок и спиннер */}
            <div className="flex items-start justify-between w-full gap-2 overflow-hidden">
                <span className="truncate text-sm font-medium block flex-1 leading-tight">
                    {note.title || "Без названия"}
                </span>
                {note.isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
            </div>

            {/* 2 Строка: Метаданные */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground w-full overflow-hidden">
                <span className="shrink-0">{format(dateToUse, "d MMM yyyy", { locale: ru })}</span>
                <div className="w-0.5 h-0.5 rounded-full bg-border shrink-0" />
                <span className="flex items-center gap-0.5 shrink-0 min-w-0 overflow-hidden">
                    {isAudio ? <FileAudio className="h-3 w-3 shrink-0" /> : <FileText className="h-3 w-3 shrink-0" />}
                    <span className="truncate">{isAudio ? 'Audio' : 'Text'}</span>
                </span>
                {note.category && (
                    <>
                        <div className="w-0.5 h-0.5 rounded-full bg-border shrink-0" />
                        <span className="truncate shrink-0 block max-w-[80px]">{note.category}</span>
                    </>
                )}
            </div>

            {/* 3 Строка: Статус */}
            <div className="w-full mt-0.5">
                <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-sm font-medium border inline-block",
                    note.status === 'Pending' ? "bg-muted text-muted-foreground border-border" :
                        note.status === 'Failed' ? "bg-destructive/10 text-destructive border-destructive/20" :
                            note.status === 'Raw' ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" :
                                note.status === 'Structured' ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" :
                                    "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                )}>
                    {note.status}
                </span>
            </div>
        </Button>
    );
};