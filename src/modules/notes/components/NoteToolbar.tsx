import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import { Mic, FileJson, Sparkles, AlignLeft, Pencil, BookOpen } from "lucide-react";
import { notesApi, type NoteDetailsDto, type NoteStatus } from "@/modules/notes";

const StatusBadge = ({ status }: { status: NoteStatus }) => {
    const styles = {
        'Pending': 'text-muted-foreground bg-muted',
        'Failed': 'text-destructive bg-destructive/10',
        'Raw': 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
        'Structured': 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
        'Summarized': 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    }[status] || 'text-muted-foreground bg-muted';

    return <span className={cn("text-[10px] px-2 py-0.5 rounded-sm font-medium border border-transparent select-none", styles)}>{status}</span>;
};

interface NoteToolbarProps {
    note: NoteDetailsDto;
    viewMode: 'raw' | 'structured' | 'summary';
    setViewMode: (mode: 'raw' | 'structured' | 'summary') => void;
    isEditing: boolean;
    toggleEditMode: () => void;
}

export const NoteToolbar = ({ note, viewMode, setViewMode, isEditing, toggleEditMode }: NoteToolbarProps) => {
    const queryClient = useQueryClient();

    const transcribeMutation = useMutation({
        mutationFn: notesApi.transcribe,
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['note', note.id] }); }
    });

    const structureMutation = useMutation({
        mutationFn: notesApi.structure,
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['note', note.id] }); }
    });

    const summarizeMutation = useMutation({
        mutationFn: notesApi.summarize,
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['note', note.id] }); }
    });

    return (
        <div className="h-10 border-b border-border bg-background flex items-center justify-between px-4 flex-shrink-0 select-none">
            <div className="flex items-center gap-3">
                <StatusBadge status={note.status} />
                <Separator orientation="vertical" className="h-3 bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {note.sourceType === 'AudioFile' ? 'Audio' : 'Text'}
                </span>
                {note.category && (
                    <>
                        <Separator orientation="vertical" className="h-3 bg-border" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{note.category}</span>
                    </>
                )}
                <span className="text-[10px] text-muted-foreground ml-2">
                    {format(new Date(note.updatedAt || note.createdAt), "d MMM, HH:mm", { locale: ru })}
                </span>
            </div>

            <div className="flex items-center gap-2">
                {viewMode === 'raw' && note.sourceType === 'AudioFile' && (
                    <Button variant="outline" size="sm" onClick={() => transcribeMutation.mutate(note.id)} disabled={transcribeMutation.isPending} className="h-7 text-xs rounded-md">
                        <Mic className="h-3.5 w-3.5 mr-1" /> Transcribe
                    </Button>
                )}
                {viewMode === 'structured' && (
                    <Button variant="outline" size="sm" onClick={() => structureMutation.mutate(note.id)} disabled={structureMutation.isPending} className="h-7 text-xs rounded-md">
                        <FileJson className="h-3.5 w-3.5 mr-1" /> Structure
                    </Button>
                )}
                {viewMode === 'summary' && (
                    <Button variant="outline" size="sm" onClick={() => summarizeMutation.mutate(note.id)} disabled={summarizeMutation.isPending} className="h-7 text-xs rounded-md">
                        <Sparkles className="h-3.5 w-3.5 mr-1" /> Summarize
                    </Button>
                )}

                <div className="flex items-center bg-muted rounded-md p-0.5 border border-border">
                    {(['raw', 'structured', 'summary'] as const).map((mode) => (
                        <button key={mode} onClick={() => setViewMode(mode)} disabled={isEditing} className={cn("flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-sm transition-all", viewMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground", isEditing && "opacity-50 cursor-not-allowed")}>
                            {mode === 'raw' && <><AlignLeft className="h-3 w-3" /> Raw</>}
                            {mode === 'structured' && <><FileJson className="h-3 w-3" /> Structured</>}
                            {mode === 'summary' && <><Sparkles className="h-3 w-3" /> Summary</>}
                        </button>
                    ))}
                </div>
                <Separator orientation="vertical" className="h-4 mx-1 bg-border" />
                <Button variant="ghost" size="sm" className={cn("h-7 px-2 gap-1.5 text-xs font-normal rounded-md", isEditing ? "text-primary bg-primary/10" : "text-muted-foreground")} onClick={toggleEditMode}>
                    {isEditing ? <><BookOpen className="h-3.5 w-3.5" /> Preview</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                </Button>
            </div>
        </div>
    );
};