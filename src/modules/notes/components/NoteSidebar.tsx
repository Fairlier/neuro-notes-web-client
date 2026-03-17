import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
    Info,
    MessageSquareText,
    FileAudio,
    Trash2,
    ScanText,
    FileJson,
    FileChartColumnIncreasing,
    Calendar,
    Tag,
    Activity,
    History,
    FileQuestion,
    Zap,
    ClipboardList
} from "lucide-react";
import { NoteChatPanel } from "@/modules/chat";
import { AudioPlayer, notesApi, type NoteDetailsDto, type NoteStatus, type NoteListItemDto } from "@/modules/notes";
import { cn } from "@/shared/lib/utils";

const STATUS_LABELS: Record<NoteStatus, string> = {
    Pending: "Ожидание",
    Failed: "Ошибка",
    Raw: "Черновик",
    Structured: "Структурировано",
    Summarized: "Готово",
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
            await queryClient.cancelQueries({ queryKey: ['notes'] });

            const previousNote = queryClient.getQueryData<NoteDetailsDto>(['note', note.id]);

            queryClient.setQueryData<NoteDetailsDto>(['note', note.id], (old) =>
                old ? { ...old, isProcessing: true, status: 'Pending' } : undefined
            );

            queryClient.setQueriesData<{ notes: NoteListItemDto[] }>(
                { queryKey: ['notes'] },
                (old) => {
                    if (!old?.notes) return old;
                    return {
                        ...old,
                        notes: old.notes.map(n =>
                            n.id === note.id
                                ? { ...n, isProcessing: true, status: 'Pending' as NoteStatus }
                                : n
                        )
                    };
                }
            );

            return { previousNote };
        },
        onError: (_err: unknown, _variables: string, context: NoteMutationContext | undefined) => {
            if (context?.previousNote) {
                queryClient.setQueryData(['note', note.id], context.previousNote);
            }
            queryClient.invalidateQueries({ queryKey: ['notes'] });
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
            <div className="h-10 border-b border-border flex items-center justify-between px-4 flex-shrink-0 bg-background/80 backdrop-blur-md">
                <div className="flex items-center gap-1">
                    <TabButton active={sidebarView === 'info'} onClick={() => setSidebarView('info')} icon={<Info className="h-4 w-4" />} />
                    <TabButton active={sidebarView === 'chat'} onClick={() => setSidebarView('chat')} icon={<MessageSquareText className="h-4 w-4" />} />
                    {note.sourceType === 'AudioFile' && (
                        <TabButton active={sidebarView === 'audio'} onClick={() => setSidebarView('audio')} icon={<FileAudio className="h-4 w-4" />} />
                    )}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] select-none">
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
                    <div className="p-4 space-y-4">
                        {/* БЛОК 1: Свойства */}
                        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                                <ClipboardList className="h-3.5 w-3.5 text-primary" />
                                <h2 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Свойства
                                </h2>
                            </div>
                            <div className="p-4 space-y-3">
                                <InfoRow
                                    label="Статус"
                                    icon={<Activity className="h-3.5 w-3.5" />}
                                    value={STATUS_LABELS[note.status] || note.status}
                                />
                                <InfoRow
                                    label="Источник"
                                    icon={<FileQuestion className="h-3.5 w-3.5" />}
                                    value={note.sourceType === 'AudioFile' ? 'Аудио' : 'Текст'}
                                />
                                {note.category && (
                                    <InfoRow label="Категория" icon={<Tag className="h-3.5 w-3.5" />} value={note.category} />
                                )}
                                <InfoRow
                                    label="Создана"
                                    icon={<Calendar className="h-3.5 w-3.5" />}
                                    value={format(new Date(note.createdAt), "dd.MM.yyyy HH:mm")}
                                />
                                {note.updatedAt && (
                                    <InfoRow
                                        label="Изменена"
                                        icon={<History className="h-3.5 w-3.5" />}
                                        value={format(new Date(note.updatedAt), "dd.MM.yyyy HH:mm")}
                                    />
                                )}
                            </div>
                        </section>

                        {/* БЛОК 2: Действия */}
                        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-primary" />
                                <h2 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Действия
                                </h2>
                            </div>
                            <div className="p-4 space-y-2">
                                {note.sourceType === 'AudioFile' && (
                                    <ActionButton
                                        icon={<ScanText className="h-3.5 w-3.5" />}
                                        label="Транскрибировать"
                                        onClick={() => transcribeMutation.mutate(note.id)}
                                        loading={transcribeMutation.isPending}
                                        disabled={isTranscribeDisabled}
                                    />
                                )}
                                <ActionButton
                                    icon={<FileChartColumnIncreasing className="h-3.5 w-3.5" />}
                                    label="Структурировать"
                                    onClick={() => structureMutation.mutate(note.id)}
                                    loading={structureMutation.isPending}
                                    disabled={isStructureDisabled}
                                />
                                <ActionButton
                                    icon={<FileJson className="h-3.5 w-3.5" />}
                                    label="Сделать резюме"
                                    onClick={() => summarizeMutation.mutate(note.id)}
                                    loading={summarizeMutation.isPending}
                                    disabled={isSummarizeDisabled}
                                />

                                <div className="h-3" />

                                <div className="pt-6 border-t border-border/50">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start text-destructive hover:bg-destructive/10 border-border/60 hover:border-destructive/40 h-9 text-[11px] font-bold transition-all"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="mr-2.5 h-3.5 w-3.5" /> Удалить заметку
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </ScrollArea>
            )}
        </aside>
    );
};

const TabButton = ({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) => (
    <Button
        variant="ghost"
        size="icon"
        className={cn(
            "h-8 w-8 rounded-md transition-all",
            active
                ? "text-primary bg-primary/10 shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        onClick={onClick}
    >
        {icon}
    </Button>
);

const InfoRow = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
    <div className="flex justify-between items-center text-[11px] gap-2">
        <div className="flex items-center gap-2 text-muted-foreground font-medium shrink-0">
            <span className="text-primary/70">{icon}</span>
            <span className="select-none">{label}</span>
        </div>
        <span className="font-bold text-foreground truncate">{value}</span>
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