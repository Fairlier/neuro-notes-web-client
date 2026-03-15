import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, ArrowUp } from "lucide-react";

import { chatApi } from "../api/chatApi";
import type { ChatMessageDto, ChatHistoryResponse } from "@/modules/chat";

import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { cn } from "@/shared/lib/utils";

interface NoteChatPanelProps {
    noteId: string;
}

export const NoteChatPanel = ({ noteId }: NoteChatPanelProps) => {
    const queryClient = useQueryClient();
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { data: historyData, isLoading } = useQuery({
        queryKey: ['chat', 'note', noteId],
        queryFn: () => chatApi.getNoteHistory(noteId),
    });

    const messages = useMemo(() => historyData?.messages || [], [historyData]);

    const clearHistoryMutation = useMutation({
        mutationFn: () => chatApi.clearNoteHistory(noteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'note', noteId] });
        }
    });

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const nextHeight = Math.min(textarea.scrollHeight, 200);
            textarea.style.height = `${nextHeight}px`;
        }
    }, [inputValue]);

    const sendMessageMutation = useMutation({
        mutationFn: (message: string) => chatApi.sendNoteMessage(noteId, message),
        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey: ['chat', 'note', noteId] });
            const previousHistory = queryClient.getQueryData<ChatHistoryResponse>(['chat', 'note', noteId]);
            const optimisticUserMsg: ChatMessageDto = {
                id: `temp-${Date.now()}`,
                role: 'User',
                content: newMessage,
                createdAt: new Date().toISOString()
            };
            queryClient.setQueryData<ChatHistoryResponse>(['chat', 'note', noteId], (old) => {
                if (!old) return { sessionId: '', relatedNoteId: noteId, title: '', messages: [optimisticUserMsg] };
                return { ...old, messages: [...old.messages, optimisticUserMsg] };
            });
            return { previousHistory };
        },
        onSuccess: (data) => {
            queryClient.setQueryData<ChatHistoryResponse>(['chat', 'note', noteId], (old) => {
                if (!old) return old;
                const assistantMsg: ChatMessageDto = {
                    id: `assistant-${Date.now()}`,
                    role: 'Assistant',
                    content: data.response,
                    createdAt: new Date().toISOString()
                };
                return { ...old, sessionId: data.sessionId, messages: [...old.messages, assistantMsg] };
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'note', noteId] });
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, sendMessageMutation.isPending]);

    const handleSend = () => {
        if (!inputValue.trim() || sendMessageMutation.isPending) return;
        sendMessageMutation.mutate(inputValue);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-background min-w-0">
            <ScrollArea className="flex-1">
                <div className="p-4 flex flex-col gap-4">
                    {isLoading ? (
                        <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-muted-foreground text-center py-10 opacity-50">
                            <p className="text-xs font-medium uppercase tracking-widest font-mono">История пуста</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, i) => {
                                const isUser = msg.role.toLowerCase() === 'user';
                                return (
                                    <div key={msg.id || i} className={cn("flex flex-col gap-1 max-w-[90%] break-words", isUser ? "ml-auto items-end" : "mr-auto items-start")}>
                                        <div className={cn("px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap w-fit shadow-sm",
                                            isUser ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none border border-border")}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            {sendMessageMutation.isPending && (
                                <div className="mr-auto items-start max-w-[90%]">
                                    <div className="bg-muted px-3 py-2 rounded-2xl rounded-tl-none border border-border">
                                        <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-background flex-shrink-0">
                <div className="relative bg-muted/30 rounded-lg border border-border shadow-sm transition-all overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-primary/20">
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Спросить..."
                        className="w-full min-h-[60px] resize-none bg-transparent border-none focus-visible:ring-0 text-sm p-3 overflow-y-auto scrollbar-thin"
                        disabled={sendMessageMutation.isPending}
                    />

                    {/* Панель кнопок внутри области ввода */}
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded-b-lg border-t border-border">
                        <div className="flex items-center">
                            {messages.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    onClick={() => clearHistoryMutation.mutate()}
                                    disabled={clearHistoryMutation.isPending}
                                    title="Очистить историю"
                                >
                                    {clearHistoryMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>

                        <Button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || sendMessageMutation.isPending}
                            size="icon"
                            className={cn(
                                "rounded-md transition-all h-8 w-8",
                                inputValue.trim() ? "bg-primary hover:bg-primary/90 shadow-md" : "bg-muted text-muted-foreground"
                            )}
                        >
                            {sendMessageMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowUp className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};