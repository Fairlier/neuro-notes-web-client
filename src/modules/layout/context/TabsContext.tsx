import { createContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface TabData {
    id: string;
    title: string;
}

interface TabsContextType {
    tabs: TabData[];
    activeTabId: string | null;
    lastActiveTabId: string | null;
    openNoteInCurrentTab: (id: string, title: string) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    createNewTab: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const TabsContext = createContext<TabsContextType | undefined>(undefined);

// Ключи для localStorage
const TABS_STORAGE_KEY = "neuro_notes_tabs";
const LAST_ACTIVE_KEY = "neuro_notes_last_active_id";

export function TabsProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Инициализируем состояние из localStorage (если оно там есть)
    const [tabs, setTabs] = useState<TabData[]>(() => {
        const savedTabs = localStorage.getItem(TABS_STORAGE_KEY);
        return savedTabs ? JSON.parse(savedTabs) : [];
    });

    const [lastActiveTabId, setLastActiveTabId] = useState<string | null>(() => {
        return localStorage.getItem(LAST_ACTIVE_KEY);
    });

    // 2. Эффект для сохранения вкладок при их изменении
    useEffect(() => {
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    }, [tabs]);

    // 3. Эффект для сохранения последнего активного ID
    useEffect(() => {
        if (lastActiveTabId) {
            localStorage.setItem(LAST_ACTIVE_KEY, lastActiveTabId);
        } else {
            localStorage.removeItem(LAST_ACTIVE_KEY);
        }
    }, [lastActiveTabId]);

    const activeTabId = useMemo(() => {
        const match = location.pathname.match(/^\/notes\/([^/]+)/);
        return match ? match[1] : null;
    }, [location.pathname]);

    // Синхронизация последнего активного ID во время рендера (без useEffect для ESLint)
    if (activeTabId && activeTabId !== 'new' && activeTabId !== lastActiveTabId) {
        setLastActiveTabId(activeTabId);
    }

    const openNoteInCurrentTab = useCallback((id: string, title: string) => {
        setTabs(prev => {
            const exists = prev.find(t => t.id === id);
            if (exists) return prev;

            const currentActiveId = location.pathname.match(/^\/notes\/([^/]+)/)?.[1];

            if (!currentActiveId || currentActiveId === 'new') {
                return [...prev, { id, title }];
            }
            return prev.map(t => t.id === currentActiveId ? { id, title } : t);
        });
        navigate(`/notes/${id}`);
    }, [navigate, location.pathname]);

    const closeTab = useCallback((id: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);

            if (activeTabId === id) {
                if (newTabs.length > 0) {
                    navigate(`/notes/${newTabs[newTabs.length - 1].id}`);
                } else {
                    navigate('/notes');
                }
            }

            if (lastActiveTabId === id) {
                setLastActiveTabId(null);
            }

            return newTabs;
        });
    }, [navigate, activeTabId, lastActiveTabId]);

    const setActiveTab = useCallback((id: string) => {
        navigate(`/notes/${id}`);
    }, [navigate]);

    const createNewTab = useCallback(() => {
        navigate('/notes/new');
    }, [navigate]);

    const value = useMemo(() => ({
        tabs,
        activeTabId,
        lastActiveTabId,
        openNoteInCurrentTab,
        closeTab,
        setActiveTab,
        createNewTab
    }), [tabs, activeTabId, lastActiveTabId, openNoteInCurrentTab, closeTab, setActiveTab, createNewTab]);

    return (
        <TabsContext.Provider value={value}>
            {children}
        </TabsContext.Provider>
    );
}