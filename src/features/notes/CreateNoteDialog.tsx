import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/api/notes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";

const createNoteSchema = z.object({
    title: z.string().min(1, "Заголовок обязателен").max(200, "Слишком длинный"),
    content: z.string().min(1, "Текст не может быть пустым"),
});

type CreateNoteFormValues = z.infer<typeof createNoteSchema>;

export function CreateNoteDialog() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<CreateNoteFormValues>({
        resolver: zodResolver(createNoteSchema),
        defaultValues: { title: "", content: "" },
    });

    const createNoteMutation = useMutation({
        mutationFn: notesApi.createDirectText,
        onSuccess: () => {
            setOpen(false);
            form.reset();
            toast.success("Заметка создана!");
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
        onError: () => toast.error("Ошибка при создании"),
    });

    const onSubmit = (data: CreateNoteFormValues) => {
        createNoteMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {/* Кнопка "Создать" теперь внутри диалога */}
                <Button variant="outline" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Новая заметка</DialogTitle>
                    <DialogDescription>Добавьте текстовую заметку</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Заголовок</FormLabel>
                                    <FormControl><Input placeholder="Заголовок..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Текст</FormLabel>
                                    <FormControl><Textarea placeholder="Текст заметки..." className="min-h-[100px]" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={createNoteMutation.isPending}>
                                {createNoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Создать
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}