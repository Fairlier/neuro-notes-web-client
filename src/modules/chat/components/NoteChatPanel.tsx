import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2, ArrowUp } from "lucide-react";
import Markdown from "react-markdown";

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
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { data: historyData, isLoading } = useQuery({
        queryKey: ["chat", "note", noteId],
        queryFn: () => chatApi.getNoteHistory(noteId),
    });

    const messages = useMemo(() => historyData?.messages || [], [historyData]);

    const clearHistoryMutation = useMutation({
        mutationFn: () => chatApi.clearNoteHistory(noteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chat", "note", noteId] });
        },
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
            await queryClient.cancelQueries({ queryKey: ["chat", "note", noteId] });

            const previousHistory = queryClient.getQueryData<ChatHistoryResponse>([
                "chat",
                "note",
                noteId,
            ]);

            const optimisticUserMsg: ChatMessageDto = {
                id: `temp-${Date.now()}`,
                role: "User",
                content: newMessage,
                createdAt: new Date().toISOString(),
            };

            queryClient.setQueryData<ChatHistoryResponse>(
                ["chat", "note", noteId],
                (old) => {
                    if (!old) {
                        return {
                            sessionId: "",
                            relatedNoteId: noteId,
                            title: "",
                            messages: [optimisticUserMsg],
                        };
                    }

                    return {
                        ...old,
                        messages: [...old.messages, optimisticUserMsg],
                    };
                }
            );

            return { previousHistory };
        },
        onSuccess: (data) => {
            queryClient.setQueryData<ChatHistoryResponse>(
                ["chat", "note", noteId],
                (old) => {
                    if (!old) return old;

                    const assistantMsg: ChatMessageDto = {
                        id: `assistant-${Date.now()}`,
                        role: "Assistant",
                        content: data.response,
                        createdAt: new Date().toISOString(),
                    };

                    return {
                        ...old,
                        sessionId: data.sessionId,
                        messages: [...old.messages, assistantMsg],
                    };
                }
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["chat", "note", noteId] });
        },
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
        <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-background">
            <ScrollArea className="flex-1 min-w-0">
                <div className="p-4 flex flex-col gap-4 min-w-0">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, i) => {
                                const isUser = msg.role.toLowerCase() === "user";

                                return (
                                    <div
                                        key={msg.id || i}
                                        className={cn(
                                            "flex w-full min-w-0",
                                            isUser ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[90%] min-w-0 rounded-2xl px-3 py-2 text-sm shadow-sm",
                                                isUser
                                                    ? "bg-muted text-foreground rounded-tr-none whitespace-pre-wrap"
                                                    : "bg-card border border-border text-card-foreground rounded-tl-none"
                                            )}
                                        >
                                            {isUser ? (
                                                <div className="whitespace-pre-wrap break-words">
                                                    {msg.content}
                                                </div>
                                            ) : (
                                                <div className="min-w-0 break-words text-sm leading-relaxed">
                                                    <Markdown
                                                        components={{
                                                            p: ({ children }) => (
                                                                <p className="mb-2 last:mb-0 break-words">
                                                                    {children}
                                                                </p>
                                                            ),
                                                            ul: ({ children }) => (
                                                                <ul className="list-disc pl-5 mb-2 last:mb-0">
                                                                    {children}
                                                                </ul>
                                                            ),
                                                            ol: ({ children }) => (
                                                                <ol className="list-decimal pl-5 mb-2 last:mb-0">
                                                                    {children}
                                                                </ol>
                                                            ),
                                                            li: ({ children }) => (
                                                                <li className="mb-1 break-words">{children}</li>
                                                            ),
                                                            strong: ({ children }) => (
                                                                <strong className="font-semibold">
                                                                    {children}
                                                                </strong>
                                                            ),
                                                            em: ({ children }) => (
                                                                <em className="italic">{children}</em>
                                                            ),
                                                            code: ({ children, className }) => (
                                                                <code
                                                                    className={cn(
                                                                        "rounded bg-muted text-foreground text-[0.85em]",
                                                                        className?.includes("language-")
                                                                            ? "block whitespace-pre-wrap break-words p-2"
                                                                            : "px-1 py-0.5 break-words"
                                                                    )}
                                                                >
                                                                    {children}
                                                                </code>
                                                            ),
                                                            pre: ({ children }) => (
                                                                <pre className="mb-2 last:mb-0 max-w-full overflow-x-auto rounded-md bg-muted p-2 text-xs">
                                                                    {children}
                                                                </pre>
                                                            ),
                                                            a: ({ href, children }) => (
                                                                <a
                                                                    href={href}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-primary underline break-all"
                                                                >
                                                                    {children}
                                                                </a>
                                                            ),
                                                            blockquote: ({ children }) => (
                                                                <blockquote className="border-l-2 border-border pl-3 italic mb-2 last:mb-0">
                                                                    {children}
                                                                </blockquote>
                                                            ),
                                                        }}
                                                    >
                                                        {msg.content || ""}
                                                    </Markdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {sendMessageMutation.isPending && (
                                <div className="flex w-full justify-start">
                                    <div className="max-w-[90%] rounded-2xl rounded-tl-none border border-border bg-muted px-3 py-2">
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
                        placeholder={t("noteChat.placeholder")}
                        className="w-full min-h-[60px] resize-none bg-transparent border-none focus-visible:ring-0 text-sm p-3 overflow-y-auto scrollbar-thin"
                        disabled={sendMessageMutation.isPending}
                    />

                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded-b-lg border-t border-border">
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => {
                                    if (confirm(t("noteChat.confirmClear"))) {
                                        clearHistoryMutation.mutate();
                                    }
                                }}
                                disabled={messages.length === 0 || clearHistoryMutation.isPending}
                                title={t("noteChat.clearHistory")}
                            >
                                {clearHistoryMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        <Button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || sendMessageMutation.isPending}
                            size="icon"
                            className={cn(
                                "rounded-md transition-all h-8 w-8",
                                inputValue.trim()
                                    ? "bg-primary hover:bg-primary/90 shadow-md"
                                    : "bg-muted text-muted-foreground"
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