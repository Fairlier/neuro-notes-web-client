import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/modules/users/api/usersApi";
import { systemApi } from "@/modules/system/api/systemApi";
import type { UserAIProfileResponse, AIOperationSettingsDto } from "@/modules/users/types/usersTypes";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Loader2, CheckCircle2, Cpu, KeyRound, Plus, Trash2, Settings2, Globe, Save, RotateCcw } from "lucide-react";

type OperationKey = 'transcription' | 'structuring' | 'summarization' | 'globalChat' | 'noteChat';

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<UserAIProfileResponse>>({});
    const [successMsg, setSuccessMsg] = useState("");

    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [newSettingKey, setNewSettingKey] = useState("");
    const [newSettingValue, setNewSettingValue] = useState("");

    const { data: aiProfile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['userAiProfile'],
        queryFn: usersApi.getAiProfile,
    });

    const { data: systemConfig, isLoading: isConfigLoading } = useQuery({
        queryKey: ['systemConfig'],
        queryFn: systemApi.getConfig,
    });

    useEffect(() => {
        if (aiProfile) {
            setFormData(aiProfile);
        }
    }, [aiProfile]);

    const updateProfileMutation = useMutation({
        mutationFn: usersApi.updateAiProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userAiProfile'] });
            setSuccessMsg("Настройки успешно сохранены");
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    });

    const resetProfileMutation = useMutation({
        mutationFn: usersApi.resetAiProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userAiProfile'] });
            setSuccessMsg("Настройки сброшены");
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    const handleReset = () => {
        if (window.confirm("Вы уверены, что хотите сбросить настройки ИИ до заводских? Все ваши кастомные промпты и API ключи будут удалены!")) {
            resetProfileMutation.mutate();
        }
    };

    const updateOperationSetting = (operation: OperationKey, field: keyof AIOperationSettingsDto, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [operation]: {
                ...(prev[operation] || { useCustomPrompt: false }),
                [field]: value
            }
        }));
    };

    const addProviderSetting = () => {
        if (!selectedProvider || !newSettingKey) return;
        setFormData(prev => {
            const currentSettings = prev.providerSettings || {};
            const providerDict = currentSettings[selectedProvider] || {};
            return {
                ...prev,
                providerSettings: {
                    ...currentSettings,
                    [selectedProvider]: { ...providerDict, [newSettingKey]: newSettingValue }
                }
            };
        });
        setNewSettingKey("");
        setNewSettingValue("");
    };

    const removeProviderSetting = (provider: string, key: string) => {
        setFormData(prev => {
            const currentSettings = { ...(prev.providerSettings || {}) };
            if (currentSettings[provider]) {
                const providerDict = { ...currentSettings[provider] };
                delete providerDict[key];
                currentSettings[provider] = providerDict;
            }
            return { ...prev, providerSettings: currentSettings };
        });
    };

    const allProviders = Array.from(new Set([
        ...(systemConfig?.providers.transcription || []),
        ...(systemConfig?.providers.structure || []),
        ...(systemConfig?.providers.summary || []),
        ...(systemConfig?.providers.chat || [])
    ]));

    if (isProfileLoading || isConfigLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const renderOperationSettings = (
        title: string,
        operationKey: OperationKey,
        providerKey: keyof UserAIProfileResponse,
        providerList: string[] = []
    ) => {
        const opData = formData[operationKey] as AIOperationSettingsDto | undefined;
        const isCustom = opData?.useCustomPrompt || false;

        return (
            <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-muted-foreground" /> {title}
                    </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Провайдер</label>
                        <Select
                            value={(formData[providerKey] as string) || ""}
                            onValueChange={(v) => setFormData({...formData, [providerKey]: v})}
                        >
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="По умолчанию" />
                            </SelectTrigger>
                            <SelectContent>
                                {providerList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Свой язык (2 буквы)</label>
                        <Input
                            value={opData?.targetLanguage || ""}
                            onChange={(e) => updateOperationSetting(operationKey, 'targetLanguage', e.target.value.toLowerCase())}
                            maxLength={2}
                            placeholder="Например: ru"
                            className="bg-background font-mono"
                        />
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isCustom}
                            onChange={(e) => updateOperationSetting(operationKey, 'useCustomPrompt', e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary bg-background"
                        />
                        <span className="text-sm font-medium">Использовать кастомный промт</span>
                    </label>

                    {isCustom && (
                        <Textarea
                            value={opData?.customPrompt || ""}
                            onChange={(e) => updateOperationSetting(operationKey, 'customPrompt', e.target.value)}
                            placeholder={`Введите промт для ${title.toLowerCase()}...`}
                            className="min-h-[100px] bg-background resize-y text-sm"
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 w-full overflow-y-auto h-full relative">
            <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <Cpu className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Настройки ИИ</h1>
                    <p className="text-sm text-muted-foreground">Промты, провайдеры и API ключи</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-8 items-start relative">

                {/* --- ЛЕВАЯ КОЛОНКА С ОСНОВНЫМ КОНТЕНТОМ --- */}
                <div className="flex-1 space-y-8 bg-card p-4 sm:p-8 rounded-lg border border-border shadow-sm w-full">

                    {/* --- 1. БАЗОВЫЕ НАСТРОЙКИ --- */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Общие параметры</h3>

                        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
                            <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
                                <h4 className="font-semibold text-foreground flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" /> Глобальные настройки
                                </h4>
                            </div>
                            <div className="space-y-1.5 max-w-sm">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Глобальный язык генерации (2 буквы)</label>
                                <Input
                                    value={formData.aiOperationLanguage || ""}
                                    onChange={(e) => setFormData({...formData, aiOperationLanguage: e.target.value.toLowerCase()})}
                                    maxLength={2}
                                    placeholder="Например: ru, en"
                                    className="bg-background font-mono uppercase"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Используется, если у конкретной операции не задан свой язык.</p>
                            </div>
                        </div>
                    </section>

                    {/* --- 2. НАСТРОЙКИ ОПЕРАЦИЙ (ПРОМТЫ И ПРОВАЙДЕРЫ) --- */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Операции и Промты</h3>
                        <div className="grid grid-cols-1 gap-6">
                            {renderOperationSettings("Транскрибация", "transcription", "transcriptionProvider", systemConfig?.providers.transcription)}
                            {renderOperationSettings("Структурирование", "structuring", "structureProvider", systemConfig?.providers.structure)}
                            {renderOperationSettings("Саммаризация", "summarization", "summaryProvider", systemConfig?.providers.summary)}
                            {renderOperationSettings("Общий чат (Global)", "globalChat", "globalChatProvider", systemConfig?.providers.chat)}
                            {renderOperationSettings("Чат по заметке (Note)", "noteChat", "noteChatProvider", systemConfig?.providers.chat)}
                        </div>
                    </section>

                    {/* --- 3. СЛОВАРЬ НАСТРОЕК (API КЛЮЧИ И ПАРАМЕТРЫ) --- */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                            <KeyRound className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-foreground">Настройки провайдеров (API ключи, модели)</h3>
                        </div>

                        <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-6">
                            {/* Форма добавления ключа */}
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="space-y-1.5 w-full sm:w-1/4">
                                    <label className="text-xs font-medium text-muted-foreground">Провайдер</label>
                                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                                        <SelectTrigger className="bg-background"><SelectValue placeholder="Выбрать..." /></SelectTrigger>
                                        <SelectContent>
                                            {allProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 w-full sm:w-1/4">
                                    <label className="text-xs font-medium text-muted-foreground">Ключ (например: ApiKey, Model)</label>
                                    <Input value={newSettingKey} onChange={e => setNewSettingKey(e.target.value)} placeholder="ApiKey" className="bg-background"/>
                                </div>
                                <div className="space-y-1.5 w-full sm:w-2/4">
                                    <label className="text-xs font-medium text-muted-foreground">Значение</label>
                                    <div className="flex gap-2">
                                        <Input value={newSettingValue} onChange={e => setNewSettingValue(e.target.value)} placeholder="sk-..." className="bg-background"/>
                                        <Button type="button" onClick={addProviderSetting} disabled={!selectedProvider || !newSettingKey} className="shrink-0">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Список текущих ключей */}
                            <div className="space-y-4">
                                {Object.entries(formData.providerSettings || {}).map(([providerName, settingsObj]) => {
                                    const keys = Object.entries(settingsObj);
                                    if (keys.length === 0) return null;

                                    return (
                                        <div key={providerName} className="space-y-2">
                                            <h5 className="text-sm font-bold text-foreground bg-muted/50 px-2 py-1 rounded-md inline-block">{providerName}</h5>
                                            <div className="grid grid-cols-1 gap-2">
                                                {keys.map(([k, v]) => (
                                                    <div key={k} className="flex items-center justify-between bg-background border border-border p-2 rounded-md text-sm">
                                                        <div className="overflow-hidden mr-2">
                                                            <span className="font-mono text-xs text-muted-foreground">{k}: </span>
                                                            {/* Ключ не маскируется, выводится как есть */}
                                                            <span className="break-all">{v}</span>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeProviderSetting(providerName, k)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>

                {/* --- ПРАВАЯ КОЛОНКА (СТИКИ БАР) --- */}
                <div className="w-full lg:w-80 shrink-0 sticky top-4 z-10">
                    <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                            <Save className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-foreground">Управление</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Примените изменения или сбросьте профиль до заводских настроек.
                        </p>

                        <div className="flex flex-col gap-3 pt-2">
                            <Button type="submit" disabled={updateProfileMutation.isPending || resetProfileMutation.isPending} className="w-full">
                                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                {updateProfileMutation.isPending ? "Сохранение..." : "Сохранить настройки"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                                disabled={updateProfileMutation.isPending || resetProfileMutation.isPending}
                                className="w-full text-destructive hover:bg-destructive/10 border-destructive/20 hover:text-destructive"
                            >
                                {resetProfileMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                                {resetProfileMutation.isPending ? "Сброс..." : "Сбросить по умолчанию"}
                            </Button>
                        </div>

                        {successMsg && (
                            <div className="text-sm text-emerald-500 flex items-center gap-2 animate-in fade-in bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20 mt-4">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}
                    </div>
                </div>

            </form>
        </div>
    );
}