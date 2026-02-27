import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Trash2, Bot, User, MessageSquare, AlertCircle } from "lucide-react";
import Markdown from 'react-markdown';

export default function GlobalChatPage() {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // 1. Загрузка истории - ИСПРАВЛЕНО
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['global-chat'],
        queryFn: () => chatApi.getGlobalHistory(), // ✅ Правильный метод
        retry: false,
    });

    // 2. Отправка сообщения - ИСПРАВЛЕНО
    const sendMutation = useMutation({
        mutationFn: (message: string) => chatApi.sendGlobalMessage(message), // ✅ Правильный метод
        onSuccess: () => {
            setInput("");
            queryClient.invalidateQueries({ queryKey: ['global-chat'] });
        },
        onError: (err) => {
            console.error("Ошибка отправки:", err);
            alert("Не удалось отправить сообщение.");
        }
    });

    // 3. Очистка истории - ИСПРАВЛЕНО
    const clearMutation = useMutation({
        mutationFn: () => chatApi.clearGlobalHistory(), // ✅ Правильный метод
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['global-chat'] })
    });

    // 4. Автоскролл
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

    // --- ЗАЩИТА ОТ БЕЛОГО ЭКРАНА: Обработка ошибки загрузки ---
    if (isError) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center space-y-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">Ошибка загрузки чата</h2>
                <p className="text-sm text-zinc-500 max-w-md">
                    Не удалось подключиться к серверу чата. Проверьте, запущен ли бэкенд.
                </p>
                <div className="p-4 bg-zinc-100 rounded text-xs font-mono text-left max-w-lg overflow-auto">
                    {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
                </div>
                <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
            </div>
        );
    }

    // Безопасное получение сообщений
    const messages = data?.messages || [];

    return (
        <div className="flex flex-col h-full bg-white relative w-full">

            {/* --- HEADER --- */}
            <div className="h-16 border-b border-zinc-100 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 bg-white/80 backdrop-blur-md z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-zinc-900 leading-none">Общий чат</h1>
                        <p className="text-xs text-zinc-500 mt-1 hidden sm:block">AI помощник по всем вашим заметкам</p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-red-600 gap-2"
                    onClick={() => {
                        if (confirm("Вы уверены, что хотите очистить историю переписки?")) {
                            clearMutation.mutate();
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Очистить</span>
                </Button>
            </div>

            {/* --- MESSAGES AREA --- */}
            <ScrollArea className="flex-1 px-4 sm:px-8 py-6">
                <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-4">

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-200" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                            <Bot className="h-16 w-16 text-zinc-300" />
                            <div className="text-zinc-500">
                                <p className="font-medium text-lg">Чат пуст</p>
                                <p className="text-sm">Задайте вопрос, и нейросеть проанализирует все ваши заметки.</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isUser = msg.role === 'User';
                            return (
                                <div key={msg.id} className={cn("flex gap-4", isUser ? "flex-row-reverse" : "")}>
                                    {/* Аватар */}
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border mt-1",
                                        isUser ? "bg-zinc-100 border-zinc-200" : "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
                                    )}>
                                        {isUser ? <User className="h-4 w-4 text-zinc-500" /> : <Bot className="h-4 w-4" />}
                                    </div>

                                    {/* Сообщение */}
                                    <div className={cn(
                                        "rounded-2xl px-5 py-3 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%]",
                                        isUser
                                            ? "bg-zinc-100 text-zinc-800 rounded-tr-sm"
                                            : "bg-white border border-zinc-100 text-zinc-700 shadow-sm rounded-tl-sm"
                                    )}>
                                        {isUser ? (
                                            msg.content
                                        ) : (
                                            <div className="prose prose-sm max-w-none prose-zinc">
                                                <Markdown>{msg.content || ""}</Markdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Лоадер ответа (пока бот думает) */}
                    {sendMutation.isPending && (
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-white border border-zinc-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* --- INPUT AREA --- */}
            <div className="p-6 border-t border-zinc-100 bg-white">
                <div className="max-w-3xl mx-auto relative">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Задайте вопрос по базе знаний..."
                        className="min-h-[60px] max-h-[200px] w-full resize-none pr-14 py-3 pl-4 bg-zinc-50 border-zinc-200 focus-visible:ring-indigo-500 rounded-xl shadow-sm"
                    />
                    <Button
                        size="icon"
                        className="absolute bottom-2.5 right-2.5 h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                        onClick={handleSend}
                        disabled={sendMutation.isPending || !input.trim()}
                    >
                        {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="text-center mt-2 text-[10px] text-zinc-400">
                    AI может допускать ошибки. Проверяйте важную информацию.
                </div>
            </div>
        </div>
    );
}