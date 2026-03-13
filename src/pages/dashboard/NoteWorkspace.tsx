import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    notesApi,
    NoteCreator,
    NoteToolbar,
    NoteEditor,
    NoteSidebar,
    type SidebarView
} from "@/modules/notes";
import { useTabs } from "@/modules/layout";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Button } from "@/shared/ui/button";
import { File, Plus, X, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type ViewMode = 'raw' | 'structured' | 'summary' | 'error';

export default function NoteWorkspace() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const {
        tabs, activeTabId, lastActiveTabId,
        setActiveTab, createNewTab, closeTab, openNoteInCurrentTab
    } = useTabs();

    const [viewMode, setViewMode] = useState<ViewMode>('structured');
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [sidebarView, setSidebarView] = useState<SidebarView>('info');

    const [isEditing, setIsEditing] = useState(false);
    const [localContent, setLocalContent] = useState("");
    const [titleInput, setTitleInput] = useState("");

    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);

    const { data: note, isLoading, isError } = useQuery({
        queryKey: ['note', id],
        queryFn: () => notesApi.getById(id!),
        enabled: Boolean(id) && id !== 'new',
        refetchInterval: (query) => {
            const currentNote = query.state.data;
            const isProcessing = currentNote?.isProcessing || currentNote?.status === 'Pending';
            return isProcessing ? 3000 : false;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (noteId: string) => notesApi.delete(noteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            if (id) closeTab(id);
        },
        onError: (error) => {
            console.error("Ошибка при удалении:", error);
            alert("Не удалось удалить заметку. Попробуйте снова.");
        }
    });

    const handleDelete = () => {
        if (!id || id === 'new') return;

        if (window.confirm("Вы уверены, что хотите удалить эту заметку? Это действие нельзя отменить.")) {
            deleteMutation.mutate(id);
        }
    };

    const [initializedNoteId, setInitializedNoteId] = useState<string | null>(null);

    if (note && note.id !== initializedNoteId) {
        setInitializedNoteId(note.id);

        const getInitialMode = (): ViewMode => {
            if (note.status === 'Failed' || note.errorMessage) return 'error';
            if (note.structuredText) return 'structured';
            if (note.summaryText) return 'summary';
            return 'raw';
        };

        setViewMode(getInitialMode());
    }

    const displayContent = useMemo(() => {
        if (!note) return "";
        switch (viewMode) {
            case 'summary': return note.summaryText || "";
            case 'structured': return note.structuredText || "";
            case 'error': return note.errorMessage || "Ошибка отсутствует";
            case 'raw': return note.rawText || "";
            default: return "";
        }
    }, [note, viewMode]);

    const [prevViewMode, setPrevViewMode] = useState<ViewMode>(viewMode);
    if (viewMode !== prevViewMode) {
        setPrevViewMode(viewMode);
        if (isEditing) {
            setLocalContent(displayContent);
        }
    }

    const saveChangesMutation = useMutation({
        mutationFn: (data: { id: string; title: string; content: string; field: ViewMode }) => {
            const field = data.field === 'raw' ? 'rawText' : data.field === 'structured' ? 'structuredText' : 'summaryText';
            return notesApi.update(data.id, { title: data.title, [field]: data.content });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['note', id] });
            await queryClient.invalidateQueries({ queryKey: ['notes'] });
        }
    });

    useEffect(() => {
        if (!id && tabs.length > 0) {
            const targetId = lastActiveTabId || tabs[tabs.length - 1].id;
            if (tabs.some(t => t.id === targetId)) setActiveTab(targetId);
        }
    }, [id, tabs, lastActiveTabId, setActiveTab]);

    useEffect(() => {
        if (id && id !== 'new' && note) {
            openNoteInCurrentTab(id, note.title || "Без названия");
        }
    }, [id, note?.title, openNoteInCurrentTab]);

    const isCreating = id === 'new' || (!id && tabs.length === 0);

    const toggleEditMode = () => {
        if (isEditing && note && id && viewMode !== 'error') {
            saveChangesMutation.mutate({ id, title: titleInput, content: localContent, field: viewMode });
        } else if (!isEditing) {
            setTitleInput(note?.title || "");
            setLocalContent(displayContent);
        }
        setIsEditing(!isEditing);
    };

    const MIN_SIDEBAR_WIDTH = 300;

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const totalWidth = document.body.clientWidth;
            const newWidth = totalWidth - e.clientX;
            const maxWidth = totalWidth / 2;
            if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= maxWidth) {
                setSidebarWidth(newWidth);
            } else if (newWidth < MIN_SIDEBAR_WIDTH) {
                setSidebarWidth(MIN_SIDEBAR_WIDTH);
            } else if (newWidth > maxWidth) {
                setSidebarWidth(maxWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.classList.remove('select-none', 'cursor-col-resize');
        };

        if (isResizing) {
            document.body.classList.add('select-none', 'cursor-col-resize');
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground">
            {/* ШАПКА ТАБОВ */}
            <div className="h-10 bg-muted/50 flex items-end justify-between px-2 border-b border-border select-none flex-shrink-0 gap-2">

                {/* ИЗМЕНЕНИЯ ЗДЕСЬ:
                    1. overflow-x-auto для скролла
                    2. Классы скрытия скроллбара: [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                    3. onWheel для скролла колесиком мыши
                */}
                <div
                    className="flex items-end flex-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    onWheel={(e) => {
                        if (e.deltaY !== 0) {
                            e.currentTarget.scrollLeft += e.deltaY;
                        }
                    }}
                >
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTabId;
                        return (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "group relative flex items-center gap-2 px-3 py-2 cursor-pointer text-xs font-medium border-t border-x rounded-t-lg transition-all mr-[-1px]",
                                    "shrink-0 w-[160px]", // ИЗМЕНЕНИЯ ЗДЕСЬ: Заменили flex-shrink на жесткий shrink-0 и w-[160px]
                                    isActive
                                        ? "bg-background border-border text-foreground z-10 shadow-sm"
                                        : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <File className={cn(
                                    "h-3 w-3 shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )} />
                                <span className="truncate flex-1 min-w-0">{tab.title}</span>
                                <div
                                    role="button"
                                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                    className={cn(
                                        "shrink-0 p-0.5 rounded-md hover:bg-muted-foreground/20 transition-opacity",
                                        "opacity-0 group-hover:opacity-100",
                                        isActive && "opacity-100"
                                    )}
                                >
                                    <X className="h-3 w-3" />
                                </div>
                            </div>
                        );
                    })}
                    <div
                        onClick={createNewTab}
                        className="flex items-center justify-center h-8 w-8 ml-1 mb-0.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground transition-colors shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                    </div>
                </div>

                <div className="pb-1.5 pl-2 border-l border-border shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                        onClick={() => setRightSidebarOpen(!isRightSidebarOpen)}
                    >
                        {isRightSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    {!isCreating && note && (
                        <NoteToolbar
                            note={note}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            isEditing={isEditing}
                            toggleEditMode={toggleEditMode}
                        />
                    )}

                    {!isCreating && note && (note.isProcessing || note.status === 'Pending') && (
                        <div className="h-[3px] w-full bg-muted/20 overflow-hidden shrink-0">
                            <div
                                className="h-full w-1/3 rounded-full animate-shuttle bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                                style={{ animation: 'shuttle 2s infinite ease-in-out' }}
                            />
                        </div>
                    )}

                    {isCreating ? <NoteCreator /> : (
                        <ScrollArea className="flex-1">
                            <NoteEditor
                                note={note}
                                isLoading={isLoading}
                                isError={isError}
                                isEditing={isEditing}
                                displayContent={displayContent}
                                localContent={localContent}
                                setLocalContent={setLocalContent}
                                titleInput={titleInput}
                                setTitleInput={setTitleInput}
                            />
                        </ScrollArea>
                    )}
                </div>

                {!isCreating && note && isRightSidebarOpen && (
                    <div
                        className="w-1 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary transition-colors z-10 flex-shrink-0 relative group flex items-center justify-center"
                        onMouseDown={() => setIsResizing(true)}
                    >
                        <div className="w-1 h-8 bg-zinc-300 dark:bg-zinc-600 rounded-full group-hover:bg-primary transition-colors" />
                    </div>
                )}

                {!isCreating && note && (
                    <NoteSidebar
                        note={note}
                        sidebarView={sidebarView}
                        setSidebarView={setSidebarView}
                        isRightSidebarOpen={isRightSidebarOpen}
                        sidebarWidth={sidebarWidth}
                        isResizing={isResizing}
                        handleDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
}