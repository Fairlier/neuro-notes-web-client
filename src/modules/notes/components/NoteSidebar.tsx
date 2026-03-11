import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import {
    Info,
    MessageSquareText,
    FileAudio,
    Trash2,
    Mic,
    FileJson,
    Sparkles,
    Calendar,
    Tag,
    Activity,
    FileText,
    History
} from "lucide-react";
import { NoteChatPanel } from "@/modules/chat";
import { AudioPlayer, notesApi, type NoteDetailsDto, type NoteStatus } from "@/modules/notes";
import { cn } from "@/shared/lib/utils";

const STATUS_MAP: Record<NoteStatus, { label: string; color: string }> = {
    Pending: {
        label: "Ожидание",
        color: "text-muted-foreground bg-muted/50 border-muted/50"
    },
    Failed: {
        label: "Ошибка",
        color: "text-red-700 bg-red-50 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
    },
    Raw: {
        label: "Черновик",
        color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50"
    },
    Structured: {
        label: "Структурировано",
        color: "text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/50"
    },
    Summarized: {
        label: "Готово",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50"
    },
};

export type SidebarView = 'info' | 'chat' | 'audio';

interface NoteSidebarProps {
    note: NoteDetailsDto;
    sidebarView: SidebarView;
    setSidebarView: (view: SidebarView) => void;
    isRightSidebarOpen: boolean;
    sidebarWidth: number;
    isResizing: boolean;
    handleDelete: () => void;
}

interface NoteMutationContext {
    previousNote: NoteDetailsDto | undefined;
}

export const NoteSidebar = ({ note, sidebarView, setSidebarView, isRightSidebarOpen, sidebarWidth, isResizing, handleDelete }: NoteSidebarProps) => {
    const queryClient = useQueryClient();

    const actionMutationOptions = {
        onMutate: async (): Promise<NoteMutationContext> => {
            await queryClient.cancelQueries({ queryKey: ['note', note.id] });

            const previousNote = queryClient.getQueryData<NoteDetailsDto>(['note', note.id]);

            queryClient.setQueryData<NoteDetailsDto>(['note', note.id], (old) =>
                old ? { ...old, isProcessing: true, status: 'Pending' } : undefined
            );

            return { previousNote };
        },
        onError: (_err: unknown, _variables: string, context: NoteMutationContext | undefined) => {
            if (context?.previousNote) {
                queryClient.setQueryData(['note', note.id], context.previousNote);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['note', note.id] });
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        }
    };

    const transcribeMutation = useMutation({ mutationFn: notesApi.transcribe, ...actionMutationOptions });
    const structureMutation = useMutation({ mutationFn: notesApi.structure, ...actionMutationOptions });
    const summarizeMutation = useMutation({ mutationFn: notesApi.summarize, ...actionMutationOptions });

    if (!isRightSidebarOpen) return null;

    const isTranscribeDisabled = note.isProcessing;
    const isStructureDisabled = !note.rawText || note.isProcessing;
    const isSummarizeDisabled = !note.structuredText || note.isProcessing;

    return (
        <aside
            className={cn(
                "bg-muted/30 transition-all overflow-hidden flex flex-col flex-shrink-0 border-l border-border",
                isResizing ? "duration-0" : "duration-300"
            )}
            style={{ width: sidebarWidth }}
        >
            {/* Header */}
            <div className="h-12 border-b border-border flex items-center justify-between px-3 flex-shrink-0 bg-background/80 backdrop-blur-md">
                <div className="flex items-center gap-1">
                    <TabButton active={sidebarView === 'info'} onClick={() => setSidebarView('info')} icon={<Info className="h-4 w-4" />} />
                    <TabButton active={sidebarView === 'chat'} onClick={() => setSidebarView('chat')} icon={<MessageSquareText className="h-4 w-4" />} />
                    {note.sourceType === 'AudioFile' && (
                        <TabButton active={sidebarView === 'audio'} onClick={() => setSidebarView('audio')} icon={<FileAudio className="h-4 w-4" />} />
                    )}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] select-none">
                    {sidebarView === 'chat' ? 'AI Chat' : sidebarView === 'audio' ? 'Audio' : 'Info'}
                </span>
            </div>

            {sidebarView === 'chat' && <NoteChatPanel noteId={note.id} />}

            {sidebarView === 'audio' && (
                <ScrollArea className="flex-1 p-4">
                    {note.sourceType === 'AudioFile' && note.hasSourceFile ? (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5 font-mono">Аудиозапись</h4>
                            <AudioPlayer noteId={note.id} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50 italic text-xs text-center font-medium">
                            <FileAudio className="h-8 w-8 mb-2 stroke-[1px]" />
                            <p>Файл не найден</p>
                        </div>
                    )}
                </ScrollArea>
            )}

            {sidebarView === 'info' && (
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        {/* Свойства */}
                        <section className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">Свойства</h4>
                            <div className="space-y-2.5 bg-background/50 rounded-lg p-3 border border-border/40 shadow-sm">
                                <InfoRow
                                    label="Статус"
                                    icon={<Activity className="h-3 w-3" />}
                                    value={STATUS_MAP[note.status]?.label || note.status}
                                    valueClassName={cn(
                                        "px-2 py-0.5 rounded-md border text-[10px] font-bold transition-colors",
                                        STATUS_MAP[note.status]?.color || "text-muted-foreground bg-muted border-transparent"
                                    )}
                                />
                                <InfoRow
                                    label="Источник"
                                    icon={<FileText className="h-3 w-3" />}
                                    value={note.sourceType === 'AudioFile' ? 'Аудио' : 'Текст'}
                                />
                                {note.category && (
                                    <InfoRow label="Категория" icon={<Tag className="h-3 w-3" />} value={note.category} />
                                )}

                                <Separator className="my-2 opacity-50" />

                                <InfoRow
                                    label="Создана"
                                    icon={<Calendar className="h-3 w-3" />}
                                    value={format(new Date(note.createdAt), "dd.MM.yyyy HH:mm")}
                                />
                                {note.updatedAt && (
                                    <InfoRow
                                        label="Изменена"
                                        icon={<History className="h-3 w-3" />}
                                        value={format(new Date(note.updatedAt), "dd.MM.yyyy HH:mm")}
                                    />
                                )}
                            </div>
                        </section>

                        {/* Действия AI */}
                        <section className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">Действия</h4>
                            <div className="grid gap-2">
                                {note.sourceType === 'AudioFile' && (
                                    <ActionButton
                                        icon={<Mic className="h-3.5 w-3.5" />}
                                        label="Транскрибировать"
                                        onClick={() => transcribeMutation.mutate(note.id)}
                                        loading={transcribeMutation.isPending}
                                        disabled={isTranscribeDisabled}
                                    />
                                )}
                                <ActionButton
                                    icon={<FileJson className="h-3.5 w-3.5" />}
                                    label="Структурировать"
                                    onClick={() => structureMutation.mutate(note.id)}
                                    loading={structureMutation.isPending}
                                    disabled={isStructureDisabled}
                                />
                                <ActionButton
                                    icon={<Sparkles className="h-3.5 w-3.5" />}
                                    label="Сделать резюме"
                                    onClick={() => summarizeMutation.mutate(note.id)}
                                    loading={summarizeMutation.isPending}
                                    disabled={isSummarizeDisabled}
                                />
                            </div>
                        </section>

                        <Separator className="opacity-50" />

                        {/* Удаление: Красноватый стиль */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-red-600 bg-red-500/10 hover:bg-red-500/20 border-red-500/30 hover:border-red-500 h-9 text-[11px] font-bold transition-all shadow-sm"
                            onClick={handleDelete}
                        >
                            <Trash2 className="mr-2.5 h-3.5 w-3.5" /> Удалить заметку
                        </Button>
                    </div>
                </ScrollArea>
            )}
        </aside>
    );
};

/* --- UI Helpers --- */

const TabButton = ({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) => (
    <Button
        variant="ghost"
        size="icon"
        className={cn(
            "h-8 w-8 rounded-md transition-all",
            active ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
        )}
        onClick={onClick}
    >
        {icon}
    </Button>
);

const InfoRow = ({ label, value, icon, valueClassName }: { label: string, value: string, icon: React.ReactNode, valueClassName?: string }) => (
    <div className="flex justify-between items-center text-[11px] gap-2">
        <div className="flex items-center gap-2 text-muted-foreground/80 font-medium shrink-0">
            {icon}
            <span className="select-none">{label}</span>
        </div>
        <span className={cn("font-bold text-foreground truncate", valueClassName)}>{value}</span>
    </div>
);

const ActionButton = ({ icon, label, onClick, loading, disabled }: { icon: React.ReactNode, label: string, onClick: () => void, loading: boolean, disabled?: boolean }) => (
    <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={loading || disabled}
        className="w-full justify-start h-9 text-[11px] font-bold rounded-md border-border/60 bg-background hover:bg-muted hover:border-primary/30 transition-all shadow-sm group"
    >
        <span className={cn(
            "mr-2.5 transition-colors",
            loading ? "animate-spin" : (disabled ? "text-muted-foreground" : "text-primary group-hover:scale-110")
        )}>
            {icon}
        </span>
        {loading ? "Обработка..." : label}
    </Button>
);