import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { enUS } from "date-fns/locale/en-US";
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
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();

    // Функция форматирования даты с учётом локали
    const formatDate = (dateString: string) => {
        const dateFormat = t('workspace.dateFormat');
        const locale = i18n.language === 'ru' ? ru : enUS;
        return format(new Date(dateString), dateFormat, { locale });
    };

    const actionMutationOptions = {
        onMutate: async (): Promise<NoteMutationContext> => {
            await queryClient.cancelQueries({ queryKey: ['note', note.id] });
            await queryClient.cancelQueries({ queryKey: ['notes'] });

            const previousNote = queryClient.getQueryData<NoteDetailsDto>(['note', note.id]);

            queryClient.setQueryData<NoteDetailsDto>(['note', note.id], (old) =>
                old ? { ...old, isProcessing: true, status: 'Pending' } : undefined
            );

            queryClient.setQueriesData<{ pages: { notes: NoteListItemDto[] }[]; pageParams: number[] }>(
                { queryKey: ['notes'], exact: false },
                (old) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map(page => ({
                            ...page,
                            notes: page.notes.map(n =>
                                n.id === note.id
                                    ? { ...n, isProcessing: true, status: 'Pending' as NoteStatus }
                                    : n
                            )
                        }))
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

    const getStatusLabel = (status: NoteStatus) => t(`note.status.${status}`);
    const getSourceTypeLabel = (sourceType: string) =>
        t(`note.sourceType.${sourceType === 'AudioFile' ? 'AudioFile' : 'Text'}`);
    const getCategoryLabel = (category: string) => t(`note.category.${category}`, { defaultValue: category });

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
                    {t(`note.sidebar.tabs.${sidebarView}`)}
                </span>
            </div>

            {sidebarView === 'chat' && <NoteChatPanel noteId={note.id} />}

            {sidebarView === 'audio' && (
                <ScrollArea className="flex-1 p-4">
                    {note.sourceType === 'AudioFile' && note.hasSourceFile ? (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5 font-mono">
                                {t('note.sidebar.audio.title')}
                            </h4>
                            <AudioPlayer noteId={note.id} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50 italic text-xs text-center font-medium">
                            <FileAudio className="h-8 w-8 mb-2 stroke-[1px]" />
                            <p>{t('note.sidebar.audio.notFound')}</p>
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
                                    {t('note.sidebar.properties.title')}
                                </h2>
                            </div>
                            <div className="p-4 space-y-3">
                                <InfoRow
                                    label={t('note.sidebar.properties.status')}
                                    icon={<Activity className="h-3.5 w-3.5" />}
                                    value={getStatusLabel(note.status)}
                                />
                                <InfoRow
                                    label={t('note.sidebar.properties.source')}
                                    icon={<FileQuestion className="h-3.5 w-3.5" />}
                                    value={getSourceTypeLabel(note.sourceType)}
                                />
                                {note.category && (
                                    <InfoRow
                                        label={t('note.sidebar.properties.category')}
                                        icon={<Tag className="h-3.5 w-3.5" />}
                                        value={getCategoryLabel(note.category)}
                                    />
                                )}
                                <InfoRow
                                    label={t('note.sidebar.properties.createdAt')}
                                    icon={<Calendar className="h-3.5 w-3.5" />}
                                    value={formatDate(note.createdAt)}
                                />
                                {note.updatedAt && (
                                    <InfoRow
                                        label={t('note.sidebar.properties.updatedAt')}
                                        icon={<History className="h-3.5 w-3.5" />}
                                        value={formatDate(note.updatedAt)}
                                    />
                                )}
                            </div>
                        </section>

                        {/* БЛОК 2: Действия */}
                        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-primary" />
                                <h2 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    {t('note.sidebar.actions.title')}
                                </h2>
                            </div>
                            <div className="p-4 space-y-2">
                                {note.sourceType === 'AudioFile' && (
                                    <ActionButton
                                        icon={<ScanText className="h-3.5 w-3.5" />}
                                        label={t('note.sidebar.actions.transcribe')}
                                        loadingLabel={t('note.sidebar.actions.processing')}
                                        onClick={() => transcribeMutation.mutate(note.id)}
                                        loading={transcribeMutation.isPending}
                                        disabled={isTranscribeDisabled}
                                    />
                                )}
                                <ActionButton
                                    icon={<FileChartColumnIncreasing className="h-3.5 w-3.5" />}
                                    label={t('note.sidebar.actions.structure')}
                                    loadingLabel={t('note.sidebar.actions.processing')}
                                    onClick={() => structureMutation.mutate(note.id)}
                                    loading={structureMutation.isPending}
                                    disabled={isStructureDisabled}
                                />
                                <ActionButton
                                    icon={<FileJson className="h-3.5 w-3.5" />}
                                    label={t('note.sidebar.actions.summarize')}
                                    loadingLabel={t('note.sidebar.actions.processing')}
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
                                        <Trash2 className="mr-2.5 h-3.5 w-3.5" /> {t('note.sidebar.actions.delete')}
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

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    loadingLabel: string;
    onClick: () => void;
    loading: boolean;
    disabled?: boolean;
}

const ActionButton = ({ icon, label, loadingLabel, onClick, loading, disabled }: ActionButtonProps) => (
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
        {loading ? loadingLabel : label}
    </Button>
);