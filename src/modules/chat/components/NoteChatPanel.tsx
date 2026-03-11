import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, Trash2 } from "lucide-react";

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
        /* ИЗМЕНЕНИЕ: Заменяем h-full на flex-1 и добавляем min-h-0.
           Это заставит чат занимать ровно столько места, сколько осталось в сайдбаре
           после отрисовки шапки.
        */
        <div className="flex flex-col flex-1 min-h-0 bg-background min-w-0">
            <ScrollArea className="flex-1">
                <div className="p-4 flex flex-col gap-4">
                    {/* ... (isLoading и рендеринг сообщений) ... */}
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

            {/* Нижняя панель остается внизу */}
            <div className="p-3 border-t border-border bg-background space-y-2 flex-shrink-0">
                <div className="relative flex items-end gap-2 bg-muted/50 rounded-lg border border-border p-1 focus-within:ring-1 focus-within:ring-primary transition-all">
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Спросить..."
                        className="min-h-[40px] max-h-[200px] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none py-2 px-3 w-full text-sm"
                        rows={1}
                        disabled={sendMessageMutation.isPending}
                    />
                    <Button
                        type="button"
                        onClick={handleSend}
                        size="icon"
                        className="shrink-0 mb-0.5 mr-0.5 h-8 w-8"
                        disabled={!inputValue.trim() || sendMessageMutation.isPending}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                {messages.length > 0 && (
                    <div className="flex justify-start">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wider"
                            onClick={() => clearHistoryMutation.mutate()}
                            disabled={clearHistoryMutation.isPending}
                        >
                            <Trash2 className="h-3 w-3 mr-1.5" />
                            Очистить историю
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};