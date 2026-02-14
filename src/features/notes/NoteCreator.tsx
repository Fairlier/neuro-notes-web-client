import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/api/notes";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2, Mic, Paperclip, Image as ImageIcon } from "lucide-react";

export function NoteCreator() {
    const [input, setInput] = useState("");
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: notesApi.createDirectText,
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: ['notes'] });

            // Просто переходим. Workspace сам подхватит изменение и обновит вкладку.
            navigate(`/notes/${data.id}`);
        },
    });

    const handleCreate = () => {
        if (!input.trim()) return;
        const title = input.split('\n')[0].substring(0, 50) || "Новая заметка";
        createMutation.mutate({ title, content: input });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreate();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full max-w-2xl flex flex-col gap-8">
                <h1 className="text-4xl font-light text-zinc-800 text-center">What would you like to create?</h1>
                <div className="relative bg-zinc-100 rounded-2xl border border-zinc-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Напишите заметку..."
                        className="w-full min-h-[120px] resize-none bg-transparent border-none focus-visible:ring-0 text-lg p-4 placeholder:text-zinc-400"
                        autoFocus
                    />
                    <div className="flex justify-between items-center p-3">
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 rounded-full h-8 w-8"><Paperclip className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 rounded-full h-8 w-8"><ImageIcon className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 rounded-full h-8 w-8"><Mic className="h-4 w-4" /></Button>
                        </div>
                        <Button onClick={handleCreate} disabled={!input.trim() || createMutation.isPending} size="icon" className={`rounded-xl transition-all ${input.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-300'}`}>{createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <ArrowUp className="h-5 w-5" />}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}