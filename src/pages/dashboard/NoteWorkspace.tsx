import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Markdown from 'react-markdown';

import { notesApi, NoteCreator, AudioPlayer, type NoteStatus } from "@/modules/notes";
import { NoteChatPanel } from "@/modules/chat";
import { useTabs } from "@/modules/layout";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { Textarea } from "@/shared/ui/textarea";
import {
    Loader2, Sparkles, FileJson, AlignLeft, PanelRightClose, PanelRightOpen,
    File, Info, Plus, X, Trash2, Pencil, Mic, BookOpen, FileAudio, MessageSquareText
} from "lucide-react";

type ViewMode = 'raw' | 'structured' | 'summary';
type SidebarView = 'info' | 'chat' | 'audio';

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

export default function NoteWorkspace() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { tabs, activeTabId, setActiveTab, createNewTab, closeTab, openNoteInCurrentTab } = useTabs();

    const [viewMode, setViewMode] = useState<ViewMode>('structured');
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [sidebarView, setSidebarView] = useState<SidebarView>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [localContent, setLocalContent] = useState("");
    const [titleInput, setTitleInput] = useState("");

    const isCreating = !id || id === 'new';

    const { data: note, isLoading, isError } = useQuery({
        queryKey: ['note', id],
        queryFn: () => notesApi.getById(id!),
        enabled: Boolean(id) && id !== 'new',
    });

    const displayContent = note
        ? (viewMode === 'summary' ? note.summaryText || "" : viewMode === 'structured' ? note.structuredText || "" : note.rawText || "")
        : "";

    const transcribeMutation = useMutation({
        mutationFn: notesApi.transcribe,
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['note', id] }); }
    });

    const structureMutation = useMutation({
        mutationFn: notesApi.structure,
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['note', id] }); }
    });

    const summarizeMutation = useMutation({
        mutationFn: notesApi.summarize,
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['note', id] }); }
    });

    const saveChangesMutation = useMutation({
        mutationFn: (data: { id: string; title: string; content: string; field: ViewMode }) => {
            const contentField = data.field === 'raw' ? 'rawText' : data.field === 'structured' ? 'structuredText' : 'summaryText';
            return notesApi.update(data.id, { title: data.title, [contentField]: data.content });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['note', id] });
            await queryClient.invalidateQueries({ queryKey: ['notes'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: notesApi.delete,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['notes'] });
            if (activeTabId) closeTab(activeTabId);
        }
    });

    const handleDelete = () => {
        if (confirm("Вы уверены, что хотите удалить эту заметку?")) {
            deleteMutation.mutate(id!);
        }
    };

    useEffect(() => {
        if (!isCreating && note && id) {
            openNoteInCurrentTab(id, note.title || "Без названия");
        }
    }, [isCreating, note, id, openNoteInCurrentTab]);

    const toggleEditMode = () => {
        if (!isEditing) {
            setLocalContent(displayContent);
            setTitleInput(note?.title || "");
        } else if (note && id) {
            saveChangesMutation.mutate({ id, title: titleInput, content: localContent, field: viewMode });
        }
        setIsEditing(!isEditing);
    };

    const renderNoteContent = () => {
        if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
        if (isError || !note) return <div className="flex h-full items-center justify-center text-muted-foreground">Заметка не найдена</div>;

        return (
            <div className="max-w-4xl mx-auto p-8 lg:p-12 h-full flex flex-col">
                {isEditing ? (
                    <input
                        value={titleInput} onChange={(e) => setTitleInput(e.target.value)}
                        className="text-3xl font-bold text-foreground mb-8 leading-tight tracking-tight outline-none bg-transparent border-none w-full p-0 focus:ring-0 placeholder:text-muted-foreground"
                        placeholder="Без названия"
                    />
                ) : (
                    <h1 className="text-3xl font-bold text-foreground mb-8 leading-tight tracking-tight cursor-default">
                        {note?.title || "Без названия"}
                    </h1>
                )}

                <div className={cn("flex-1 outline-none relative text-foreground", !isEditing && "prose prose-sm md:prose-base dark:prose-invert max-w-none leading-7")}>
                    {isEditing ? (
                        <Textarea
                            value={localContent} onChange={(e) => setLocalContent(e.target.value)}
                            className="w-full h-full min-h-[60vh] resize-none bg-transparent border-0 focus-visible:ring-0 p-0 text-base leading-relaxed font-mono text-foreground"
                            placeholder="Начните писать..."
                        />
                    ) : displayContent ? (
                        <Markdown>{displayContent}</Markdown>
                    ) : (
                        <span className="text-muted-foreground italic">Нет содержимого</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground">
            {/* ТАБЫ */}
            <div className="h-10 bg-muted/50 flex items-end justify-between px-2 border-b border-border select-none flex-shrink-0 gap-2">
                <div className="flex items-end flex-1 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTabId;
                        return (
                            <div
                                key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "group relative flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] cursor-pointer text-xs font-medium border-t border-x rounded-t-md transition-all mr-[-1px]",
                                    isActive ? "bg-background border-border text-foreground z-10 shadow-sm" : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <File className={cn("h-3 w-3 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                                <span className="truncate flex-1">{tab.title}</span>
                                <div role="button" onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className={cn("opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-muted-foreground/20", isActive && "opacity-100")}>
                                    <X className="h-3 w-3" />
                                </div>
                            </div>
                        );
                    })}
                    <div onClick={createNewTab} className="flex items-center justify-center h-8 w-8 ml-1 mb-0.5 rounded-md hover:bg-muted cursor-pointer text-muted-foreground transition-colors">
                        <Plus className="h-4 w-4" />
                    </div>
                </div>
                <div className="pb-1.5 pl-2 border-l border-border">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setRightSidebarOpen(!isRightSidebarOpen)}>
                        {isRightSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* РАБОЧАЯ ОБЛАСТЬ */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    {/* Тулбар открытой заметки */}
                    {!isCreating && note && (
                        <div className="h-10 border-b border-border bg-background flex items-center justify-between px-4 flex-shrink-0 select-none">
                            <div className="flex items-center gap-3">
                                <StatusBadge status={note.status} />
                                <Separator orientation="vertical" className="h-3 bg-border" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{note.sourceType === 'AudioFile' ? 'Audio' : 'Text'}</span>
                                {note.category && (
                                    <><Separator orientation="vertical" className="h-3 bg-border" /><span className="text-[10px] text-muted-foreground uppercase tracking-wide">{note.category}</span></>
                                )}
                                <span className="text-[10px] text-muted-foreground ml-2">{format(new Date(note.updatedAt || note.createdAt), "d MMM, HH:mm", { locale: ru })}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Кнопки AI действий */}
                                {viewMode === 'raw' && note.sourceType === 'AudioFile' && <Button variant="outline" size="sm" onClick={() => transcribeMutation.mutate(note.id)} disabled={transcribeMutation.isPending} className="h-7 text-xs"><Mic className="h-3.5 w-3.5 mr-1" /> Transcribe</Button>}
                                {viewMode === 'structured' && <Button variant="outline" size="sm" onClick={() => structureMutation.mutate(note.id)} disabled={structureMutation.isPending} className="h-7 text-xs"><FileJson className="h-3.5 w-3.5 mr-1" /> Structure</Button>}
                                {viewMode === 'summary' && <Button variant="outline" size="sm" onClick={() => summarizeMutation.mutate(note.id)} disabled={summarizeMutation.isPending} className="h-7 text-xs"><Sparkles className="h-3.5 w-3.5 mr-1" /> Summarize</Button>}

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
                                <Button variant="ghost" size="sm" className={cn("h-7 px-2 gap-1.5 text-xs font-normal", isEditing ? "text-primary bg-primary/10" : "text-muted-foreground")} onClick={toggleEditMode}>
                                    {isEditing ? <><BookOpen className="h-3.5 w-3.5" /> Preview</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                                </Button>
                            </div>
                        </div>
                    )}

                    {isCreating ? <NoteCreator /> : <ScrollArea className="flex-1">{renderNoteContent()}</ScrollArea>}
                </div>

                {/* БОКОВАЯ ПАНЕЛЬ */}
                {!isCreating && note && (
                    <aside className={cn("bg-muted/30 border-l border-border transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0", isRightSidebarOpen ? "w-[300px] opacity-100" : "w-0 opacity-0")}>
                        <div className="h-10 border-b border-border flex items-center justify-between px-3 flex-shrink-0 bg-background">
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className={cn("h-7 w-7", sidebarView === 'info' ? "text-foreground bg-muted" : "text-muted-foreground")} onClick={() => setSidebarView('info')}><Info className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className={cn("h-7 w-7", sidebarView === 'chat' ? "text-primary bg-primary/10" : "text-muted-foreground")} onClick={() => setSidebarView('chat')}><MessageSquareText className="h-4 w-4" /></Button>
                                {note.sourceType === 'AudioFile' && (
                                    <Button variant="ghost" size="icon" className={cn("h-7 w-7", sidebarView === 'audio' ? "text-primary bg-primary/10" : "text-muted-foreground")} onClick={() => setSidebarView('audio')}><FileAudio className="h-4 w-4" /></Button>
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{sidebarView === 'chat' ? 'AI Chat' : sidebarView === 'audio' ? 'Audio' : 'Info'}</span>
                        </div>

                        {sidebarView === 'chat' && <NoteChatPanel noteId={note.id} />}
                        {sidebarView === 'audio' && (
                            <ScrollArea className="flex-1 p-4">
                                {note.sourceType === 'AudioFile' && note.hasSourceFile ? (
                                    <div className="space-y-3"><div className="text-xs font-medium">Воспроизведение</div><AudioPlayer noteId={note.id} /></div>
                                ) : <div className="text-center text-muted-foreground text-xs py-8">Аудиофайл недоступен.</div>}
                            </ScrollArea>
                        )}
                        {sidebarView === 'info' && (
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-3">
                                    <div className="text-xs font-medium">Свойства</div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Создано</span><span>{format(new Date(note.createdAt), "dd.MM.yyyy HH:mm")}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="text-muted-foreground font-mono text-[10px] truncate max-w-[120px]">{note.id}</span></div>
                                    </div>
                                </div>
                                <Separator className="my-5 bg-border" />
                                <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 h-8 text-xs font-normal" onClick={handleDelete}>
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Удалить заметку
                                </Button>
                            </ScrollArea>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
}