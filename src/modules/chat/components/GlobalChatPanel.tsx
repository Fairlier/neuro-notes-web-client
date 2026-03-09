import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chatApi";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Loader2, Send, Trash2, Bot, User, MessageSquare, AlertCircle } from "lucide-react";
import Markdown from 'react-markdown';

export const GlobalChatPanel = () => {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['global-chat'],
        queryFn: () => chatApi.getGlobalHistory(),
        retry: false,
    });

    const sendMutation = useMutation({
        mutationFn: (message: string) => chatApi.sendGlobalMessage(message),
        onSuccess: () => {
            setInput("");
            queryClient.invalidateQueries({ queryKey: ['global-chat'] });
        },
        onError: (err) => {
            console.error("Ошибка отправки:", err);
            alert("Не удалось отправить сообщение.");
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

    const handleSend = () => {
        if (!input.trim()) return;
        sendMutation.mutate(input);
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
                <h2 className="text-lg font-semibold">Ошибка загрузки чата</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                    Не удалось подключиться к серверу чата. Проверьте, запущен ли бэкенд.
                </p>
                <div className="p-4 bg-muted rounded-md text-xs font-mono text-left max-w-lg overflow-auto border border-border">
                    {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
                </div>
                <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
            </div>
        );
    }

    const messages = data?.messages || [];

    return (
        <div className="flex flex-col h-full bg-background relative w-full text-foreground">
            <div className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-8 flex-shrink-0 bg-background/80 backdrop-blur-md z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-none">Общий чат</h1>
                        <p className="text-xs text-muted-foreground mt-1 hidden sm:block">AI помощник по всем вашим заметкам</p>
                    </div>
                </div>

                <Button
                    variant="ghost" size="sm"
                    className="text-muted-foreground hover:text-destructive gap-2"
                    onClick={() => {
                        if (confirm("Вы уверены, что хотите очистить историю переписки?")) clearMutation.mutate();
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Очистить</span>
                </Button>
            </div>

            <ScrollArea className="flex-1 px-4 sm:px-8 py-6">
                <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-4">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                            <Bot className="h-16 w-16 text-muted-foreground" />
                            <div className="text-muted-foreground">
                                <p className="font-medium text-lg">Чат пуст</p>
                                <p className="text-sm">Задайте вопрос, и нейросеть проанализирует все ваши заметки.</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isUser = msg.role === 'User';
                            return (
                                <div key={msg.id} className={cn("flex gap-4", isUser ? "flex-row-reverse" : "")}>
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border mt-1",
                                        isUser ? "bg-muted border-border" : "bg-primary border-primary text-primary-foreground shadow-md"
                                    )}>
                                        {isUser ? <User className="h-4 w-4 text-muted-foreground" /> : <Bot className="h-4 w-4" />}
                                    </div>

                                    <div className={cn(
                                        "rounded-2xl px-5 py-3 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%]",
                                        isUser
                                            ? "bg-muted text-foreground rounded-tr-sm"
                                            : "bg-card border border-border text-card-foreground shadow-sm rounded-tl-sm"
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
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                                <Bot className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="p-6 border-t border-border bg-background">
                <div className="max-w-3xl mx-auto relative">
                    <Textarea
                        value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder="Задайте вопрос по базе знаний..."
                        className="min-h-[60px] max-h-[200px] w-full resize-none pr-14 py-3 pl-4 bg-muted/50 border-border focus-visible:ring-primary rounded-lg shadow-sm"
                    />
                    <Button
                        size="icon"
                        className="absolute bottom-2.5 right-2.5 h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-all"
                        onClick={handleSend} disabled={sendMutation.isPending || !input.trim()}
                    >
                        {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="text-center mt-2 text-[10px] text-muted-foreground">
                    AI может допускать ошибки. Проверяйте важную информацию.
                </div>
            </div>
        </div>
    );
};