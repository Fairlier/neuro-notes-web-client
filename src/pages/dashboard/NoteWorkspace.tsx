import { useState, useEffect } from "react";
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

type ViewMode = 'raw' | 'structured' | 'summary';

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

    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);

    const isCreating = !id || id === 'new';

    const { data: note, isLoading, isError } = useQuery({
        queryKey: ['note', id],
        queryFn: () => notesApi.getById(id!),
        enabled: Boolean(id) && id !== 'new',
    });

    const displayContent = note
        ? (viewMode === 'summary' ? note.summaryText || "" : viewMode === 'structured' ? note.structuredText || "" : note.rawText || "")
        : "";

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

    const toggleEditMode = () => {
        if (!isEditing) {
            setLocalContent(displayContent);
            setTitleInput(note?.title || "");
        } else if (note && id) {
            saveChangesMutation.mutate({ id, title: titleInput, content: localContent, field: viewMode });
        }
        setIsEditing(!isEditing);
    };

    useEffect(() => {
        if (!isCreating && note && id) {
            openNoteInCurrentTab(id, note.title || "Без названия");
        }
    }, [isCreating, note, id, openNoteInCurrentTab]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = document.body.clientWidth - e.clientX;
            if (newWidth > 250 && newWidth < 800) {
                setSidebarWidth(newWidth);
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
            {/* ТАБЫ */}
            <div className="h-10 bg-muted/50 flex items-end justify-between px-2 border-b border-border select-none flex-shrink-0 gap-2">
                <div className="flex items-end flex-1 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTabId;
                        return (
                            <div
                                key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "group relative flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] cursor-pointer text-xs font-medium border-t border-x rounded-t-lg transition-all mr-[-1px]",
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
                    <div onClick={createNewTab} className="flex items-center justify-center h-8 w-8 ml-1 mb-0.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground transition-colors">
                        <Plus className="h-4 w-4" />
                    </div>
                </div>
                <div className="pb-1.5 pl-2 border-l border-border">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg" onClick={() => setRightSidebarOpen(!isRightSidebarOpen)}>
                        {isRightSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* РАБОЧАЯ ОБЛАСТЬ */}
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

                    {isCreating ? (
                        <NoteCreator />
                    ) : (
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

                {/* ПОЛЗУНОК (Resizer) */}
                {!isCreating && note && isRightSidebarOpen && (
                    <div
                        className="w-1 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary transition-colors z-10 flex-shrink-0 relative group flex items-center justify-center"
                        onMouseDown={() => setIsResizing(true)}
                    >
                        <div className="w-1 h-8 bg-zinc-300 dark:bg-zinc-600 rounded-full group-hover:bg-primary transition-colors" />
                    </div>
                )}

                {/* БОКОВАЯ ПАНЕЛЬ */}
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