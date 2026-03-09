import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Bot, Loader2, Trash2 } from "lucide-react";

import { chatApi } from "../api/chatApi";
import type { ChatMessageDto, ChatHistoryResponse } from "@/modules/chat";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { cn } from "@/shared/lib/utils";

interface NoteChatPanelProps {
    noteId: string;
}

export const NoteChatPanel = ({ noteId }: NoteChatPanelProps) => {
    const queryClient = useQueryClient();
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: historyData, isLoading } = useQuery({
        queryKey: ['chat', 'note', noteId],
        queryFn: () => chatApi.getNoteHistory(noteId),
    });

    const messagesData = historyData?.messages;
    const messages = useMemo(() => messagesData || [], [messagesData]);

    const sendMessageMutation = useMutation({
        mutationFn: (message: string) => chatApi.sendNoteMessage(noteId, message),
        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey: ['chat', 'note', noteId] });
            const previousHistory = queryClient.getQueryData<ChatHistoryResponse>(['chat', 'note', noteId]);

            // Оптимистичное сообщение пользователя
            const optimisticUserMsg: ChatMessageDto = {
                id: `temp-${Date.now()}`,
                role: 'User',
                content: newMessage,
                createdAt: new Date().toISOString()
            };

            queryClient.setQueryData<ChatHistoryResponse>(['chat', 'note', noteId], (old) => {
                if (!old) {
                    return {
                        sessionId: '',
                        relatedNoteId: noteId,
                        title: '',
                        messages: [optimisticUserMsg]
                    };
                }

                return {
                    ...old,
                    messages: [...old.messages, optimisticUserMsg]
                };
            });

            return { previousHistory };
        },
        onSuccess: (data) => {
            // Добавляем ответ ассистента
            queryClient.setQueryData<ChatHistoryResponse>(['chat', 'note', noteId], (old) => {
                if (!old) return old;

                const assistantMsg: ChatMessageDto = {
                    id: `assistant-${Date.now()}`,
                    role: 'Assistant',
                    content: data.response,
                    createdAt: new Date().toISOString()
                };

                return {
                    ...old,
                    sessionId: data.sessionId,
                    messages: [...old.messages, assistantMsg]
                };
            });
        },
        onError: (_err, _newMsg, context) => {
            if (context?.previousHistory) {
                queryClient.setQueryData(['chat', 'note', noteId], context.previousHistory);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'note', noteId] });
        }
    });

    const clearHistoryMutation = useMutation({
        mutationFn: () => chatApi.clearNoteHistory(noteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'note', noteId] });
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, sendMessageMutation.isPending]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || sendMessageMutation.isPending) return;

        sendMessageMutation.mutate(inputValue);
        setInputValue("");
    };

    return (
        <div className="flex flex-col h-full bg-background border-l border-border">
            {/* Шапка чата */}
            <div className="p-4 border-b border-border bg-card text-card-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">AI Ассистент</h3>
                </div>
                {messages.length > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => clearHistoryMutation.mutate()}
                        title="Очистить историю"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Область сообщений */}
            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                        <Bot className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">Задайте вопрос по этой заметке.</p>
                        <p className="text-xs opacity-70">
                            Я помогу найти детали, составить саммари или придумать идеи.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-4">
                        {messages.map((msg, i) => (
                            <div
                                key={msg.id || i}
                                className={cn(
                                    "flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                                    msg.role === 'User'
                                        ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-muted text-foreground rounded-bl-none border border-border"
                                )}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        ))}

                        {sendMessageMutation.isPending && (
                            <div className="flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted text-foreground rounded-bl-none border border-border">
                                <div className="flex items-center gap-1 h-5">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Инпут */}
            <div className="p-3 border-t border-border bg-background">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Спросить о заметке..."
                        className="pr-10 bg-muted/50 border-border focus-visible:ring-primary"
                        disabled={sendMessageMutation.isPending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 h-8 w-8 text-muted-foreground hover:text-primary"
                        disabled={!inputValue.trim() || sendMessageMutation.isPending}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};