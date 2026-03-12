import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/modules/users/api/usersApi";
import { systemApi } from "@/modules/system/api/systemApi";
import type { UserAIProfileResponse, AIOperationSettingsDto } from "@/modules/users/types/usersTypes";
import type { SystemConfigResponse } from "@/modules/system/types/systemTypes";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Loader2, CheckCircle2, Cpu, KeyRound, Plus, Trash2, Settings2 } from "lucide-react";

type OperationKey = 'transcription' | 'structuring' | 'summarization' | 'globalChat' | 'noteChat';

interface SettingsFormProps {
    initialData: UserAIProfileResponse;
    systemConfig: SystemConfigResponse;
}

function SettingsForm({ initialData, systemConfig }: SettingsFormProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<UserAIProfileResponse>(initialData);
    const [successMsg, setSuccessMsg] = useState("");

    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [newSettingKey, setNewSettingKey] = useState("");
    const [newSettingValue, setNewSettingValue] = useState("");

    const allProviders = useMemo(() => Array.from(new Set([
        ...(systemConfig.providers.transcription || []),
        ...(systemConfig.providers.structure || []),
        ...(systemConfig.providers.summary || []),
        ...(systemConfig.providers.chat || [])
    ])), [systemConfig]);

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
        if (window.confirm("Вы уверены, что хотите сбросить настройки ИИ?")) {
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
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Свой язык</label>
                        <Input
                            value={opData?.targetLanguage || ""}
                            onChange={(e) => updateOperationSetting(operationKey, 'targetLanguage', e.target.value.toLowerCase())}
                            maxLength={2}
                            placeholder="ru"
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
                            className="rounded border-border text-primary"
                        />
                        <span className="text-sm font-medium">Кастомный промт</span>
                    </label>

                    {isCustom && (
                        <Textarea
                            value={opData?.customPrompt || ""}
                            onChange={(e) => updateOperationSetting(operationKey, 'customPrompt', e.target.value)}
                            className="min-h-[100px] bg-background text-sm"
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-8 items-start relative">
            <div className="flex-1 space-y-8 bg-card p-4 sm:p-8 rounded-lg border border-border shadow-sm w-full">
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-border pb-2">Общие параметры</h3>
                    <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
                        <div className="space-y-1.5 max-w-sm">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Глобальный язык</label>
                            <Input
                                value={formData.aiOperationLanguage}
                                onChange={(e) => setFormData({...formData, aiOperationLanguage: e.target.value.toLowerCase()})}
                                maxLength={2}
                                className="bg-background font-mono uppercase"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-border pb-2">Операции и Промты</h3>
                    <div className="grid grid-cols-1 gap-6">
                        {renderOperationSettings("Транскрибация", "transcription", "transcriptionProvider", systemConfig.providers.transcription)}
                        {renderOperationSettings("Структурирование", "structuring", "structureProvider", systemConfig.providers.structure)}
                        {renderOperationSettings("Саммаризация", "summarization", "summaryProvider", systemConfig.providers.summary)}
                        {renderOperationSettings("Общий чат (Global)", "globalChat", "globalChatProvider", systemConfig.providers.chat)}
                        {renderOperationSettings("Чат по заметке (Note)", "noteChat", "noteChatProvider", systemConfig.providers.chat)}
                    </div>
                </section>

                {/* Настройки провайдеров (API ключи) */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <KeyRound className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Настройки провайдеров</h3>
                    </div>
                    <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-6">
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="w-full sm:w-1/4">
                                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder="Провайдер" /></SelectTrigger>
                                    <SelectContent>
                                        {allProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input value={newSettingKey} onChange={e => setNewSettingKey(e.target.value)} placeholder="Key" className="sm:w-1/4 bg-background"/>
                            <div className="flex gap-2 w-full sm:w-2/4">
                                <Input value={newSettingValue} onChange={e => setNewSettingValue(e.target.value)} placeholder="Value" className="bg-background"/>
                                <Button type="button" onClick={addProviderSetting} disabled={!selectedProvider || !newSettingKey}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(formData.providerSettings || {}).map(([providerName, settingsObj]) => (
                                <div key={providerName} className="space-y-2">
                                    <h5 className="text-sm font-bold bg-muted/50 px-2 py-1 rounded-md inline-block">{providerName}</h5>
                                    {Object.entries(settingsObj).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between bg-background border border-border p-2 rounded-md text-sm">
                                            <span className="truncate"><span className="opacity-50">{k}:</span> {v}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeProviderSetting(providerName, k)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Стики-бар управления */}
            <div className="w-full lg:w-80 shrink-0 sticky top-4 z-10">
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-4">
                    <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Сохранить настройки
                    </Button>
                    <Button type="button" variant="outline" onClick={handleReset} className="w-full text-destructive" disabled={resetProfileMutation.isPending}>
                        Сбросить всё
                    </Button>
                    {successMsg && <div className="text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {successMsg}
                    </div>}
                </div>
            </div>
        </form>
    );
}

export default function SettingsPage() {
    const { data: aiProfile, isLoading: isProfileLoading } = useQuery<UserAIProfileResponse>({
        queryKey: ['userAiProfile'],
        queryFn: usersApi.getAiProfile,
    });

    const { data: systemConfig, isLoading: isConfigLoading } = useQuery<SystemConfigResponse>({
        queryKey: ['systemConfig'],
        queryFn: systemApi.getConfig,
    });

    if (isProfileLoading || isConfigLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!aiProfile || !systemConfig) return null;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 w-full h-full relative overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
                <Cpu className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Настройки ИИ</h1>
            </div>

            <SettingsForm
                initialData={aiProfile}
                systemConfig={systemConfig}
                key={aiProfile.aiOperationLanguage + aiProfile.transcriptionProvider}
            />
        </div>
    );
}