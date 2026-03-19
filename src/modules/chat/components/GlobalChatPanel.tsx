import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { chatApi } from "../api/chatApi";
import { usersApi } from "@/modules/users";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Loader2, Trash2, Bot, User, MessageSquare, AlertCircle, ArrowUp } from "lucide-react";
import Markdown from 'react-markdown';
import type { ChatHistoryResponse } from "@/modules/chat";

export const GlobalChatPanel = () => {
    const { t } = useTranslation();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const queryClient = useQueryClient();

    const { data: profile } = useQuery({
        queryKey: ['userProfile'],
        queryFn: usersApi.getProfile,
    });

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['global-chat'],
        queryFn: () => chatApi.getGlobalHistory(),
        retry: false,
    });

    const sendMutation = useMutation({
        mutationFn: (message: string) => chatApi.sendGlobalMessage(message),
        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey: ['global-chat'] });

            const previousData = queryClient.getQueryData(['global-chat']);

            queryClient.setQueryData(['global-chat'], (old: ChatHistoryResponse | undefined) => {
                const oldMessages = old?.messages || [];
                const optimisticMsg = {
                    id: `temp-${Date.now()}`,
                    role: 'User',
                    content: newMessage,
                };

                return {
                    ...old,
                    messages: [...oldMessages, optimisticMsg]
                };
            });

            return { previousData };
        },
        onError: (err, _, context) => {
            console.error("Send error:", err);
            if (context?.previousData) {
                queryClient.setQueryData(['global-chat'], context.previousData);
            }
            alert(t('globalChat.error.sendFailed'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['global-chat'] });
        }
    });

    const clearMutation = useMutation({
        mutationFn: () => chatApi.clearGlobalHistory(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['global-chat'] })
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [data?.messages, isLoading, sendMutation.isPending]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const nextHeight = Math.max(60, Math.min(textarea.scrollHeight, 200));
            textarea.style.height = `${nextHeight}px`;
        }
    }, [input]);

    const handleSend = () => {
        if (!input.trim()) return;

        const messageToSend = input;
        setInput("");

        if (textareaRef.current) {
            textareaRef.current.style.height = "60px";
        }

        sendMutation.mutate(messageToSend);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (isError) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center space-y-4 text-foreground">
                <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold">{t('globalChat.error.title')}</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                    {t('globalChat.error.description')}
                </p>
                <div className="p-4 bg-muted rounded-md text-xs font-mono text-left max-w-lg overflow-auto border border-border">
                    {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
                </div>
                <Button onClick={() => window.location.reload()}>{t('globalChat.error.refresh')}</Button>
            </div>
        );
    }

    const messages = data?.messages || [];

    return (
        <div className="flex flex-col h-full bg-background relative w-full text-foreground overflow-hidden">
            <div className="h-20 border-b border-border flex-shrink-0 bg-background/80 backdrop-blur-md z-10 sticky top-0 w-full">
                <div className="h-full px-4 sm:px-8 max-w-8xl mx-auto flex items-center">
                    <div className="flex items-center gap-4 -ml-1.5">
                        <div className="h-11 w-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-none">{t('globalChat.title')}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 h-full">
                <div className="px-4 sm:px-8 py-6 max-w-8xl mx-auto flex flex-col gap-6">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                            <Bot className="h-16 w-16 text-muted-foreground" />
                            <div className="text-muted-foreground">
                                <p className="font-medium text-lg">{t('globalChat.empty')}</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isUser = msg.role === 'User';
                            return (
                                <div key={msg.id} className={cn("flex gap-3 items-start", isUser ? "flex-row-reverse" : "")}>
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border overflow-hidden",
                                        isUser ? "bg-muted border-border" : "bg-primary border-primary text-primary-foreground shadow-sm"
                                    )}>
                                        {isUser ? (
                                            profile?.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            )
                                        ) : (
                                            <Bot className="h-4 w-4" />
                                        )}
                                    </div>

                                    <div className={cn(
                                        "px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-sm",
                                        isUser
                                            ? "bg-muted text-foreground rounded-tr-none"
                                            : "bg-card border border-border text-card-foreground rounded-tl-none"
                                    )}>
                                        {isUser ? msg.content : (
                                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                                <Markdown>{msg.content || ""}</Markdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {sendMutation.isPending && (
                        <div className="flex gap-3 items-start">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
                                <Bot className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} className="h-32 sm:h-36 shrink-0" />
                </div>
            </ScrollArea>

            {/* Плавающая область ввода поверх чата */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-8 sm:pb-8 pt-1 bg-gradient-to-t from-background via-background/80 to-transparent z-20 pointer-events-none">
                <div className="max-w-5xl mx-auto pointer-events-auto">
                    <div className="relative bg-background rounded-xl border border-border shadow-xl transition-all overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-primary/20">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('globalChat.placeholder')}
                            className="w-full min-h-[60px] resize-none bg-transparent border-none focus-visible:ring-0 text-base p-4 overflow-y-auto scrollbar-thin"
                        />
                        <div className="flex justify-between items-center p-2 bg-muted/30 rounded-b-xl border-t border-border">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => {
                                    if (confirm(t('globalChat.confirmClear'))) clearMutation.mutate();
                                }}
                                disabled={messages.length === 0 || clearMutation.isPending}
                                title={t('globalChat.clearHistory')}
                            >
                                {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>

                            <Button
                                onClick={handleSend}
                                disabled={sendMutation.isPending || !input.trim()}
                                size="icon"
                                className={cn(
                                    "rounded-md transition-all h-8 w-8",
                                    input.trim() ? "bg-primary hover:bg-primary/90 shadow-md" : "bg-muted text-muted-foreground"
                                )}
                            >
                                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4 ml-0.5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};