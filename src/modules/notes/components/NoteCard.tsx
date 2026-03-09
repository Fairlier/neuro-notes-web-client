import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, FileAudio, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { NoteListItemDto, NoteStatus } from "@/modules/notes";

interface NoteCardProps {
    note: NoteListItemDto;
    onClick: () => void;
}

export const NoteCard = ({ note, onClick }: NoteCardProps) => {
    const statusStyles: Record<NoteStatus, string> = {
        'Pending': 'bg-muted text-muted-foreground border-border',
        'Failed': 'bg-destructive/10 text-destructive border-destructive/20',
        'Raw': 'bg-orange-50 text-orange-600 border-orange-200',
        'Structured': 'bg-purple-50 text-purple-600 border-purple-200',
        'Summarized': 'bg-green-50 text-green-600 border-green-200',
    };

    return (
        <div
            onClick={onClick}
            className="group bg-card text-card-foreground border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={cn(
                        "h-8 w-8 rounded-md flex items-center justify-center shrink-0",
                        note.sourceType === 'AudioFile' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                        {note.sourceType === 'AudioFile' ? <FileAudio className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {note.title || "Без названия"}
                    </h3>
                </div>
                <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-sm border font-medium shrink-0",
                    statusStyles[note.status]
                )}>
                    {note.status}
                </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(note.createdAt), "d MMM yyyy", { locale: ru })}</span>
                </div>
                {note.category && (
                    <span className="bg-muted px-2 py-0.5 rounded-sm text-[10px]">
                        {note.category}
                    </span>
                )}
                {note.isProcessing && (
                    <div className="flex items-center gap-1 text-primary">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Обработка...</span>
                    </div>
                )}
            </div>
        </div>
    );
};