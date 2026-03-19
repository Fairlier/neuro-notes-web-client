import { createContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface TabData {
    id: string;
    title: string;
    sourceType?: string;
}

interface TabsContextType {
    tabs: TabData[];
    activeTabId: string | null;
    lastActiveTabId: string | null;
    openNoteInCurrentTab: (id: string, title: string, sourceType?: string) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    createNewTab: () => void;
    clearAllTabs: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const TabsContext = createContext<TabsContextType | undefined>(undefined);

const TABS_STORAGE_KEY = "neuro_notes_tabs";
const LAST_ACTIVE_KEY = "neuro_notes_last_active_id";

export function TabsProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [tabs, setTabs] = useState<TabData[]>(() => {
        const saved = localStorage.getItem(TABS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const [lastActiveTabId, setLastActiveTabId] = useState<string | null>(() => {
        return localStorage.getItem(LAST_ACTIVE_KEY);
    });

    useEffect(() => {
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    }, [tabs]);

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

    const openNoteInCurrentTab = useCallback((id: string, title: string, sourceType?: string) => {
        setTabs((prev) => {
            const tabIndex = prev.findIndex((t) => t.id === id);

            if (tabIndex !== -1) {
                const existingTab = prev[tabIndex];

                if (
                    existingTab.title === title &&
                    existingTab.sourceType === sourceType
                ) {
                    return prev;
                }

                const updatedTabs = [...prev];
                updatedTabs[tabIndex] = {
                    ...existingTab,
                    title,
                    sourceType,
                };
                return updatedTabs;
            }

            const currentActiveId = location.pathname.match(/^\/notes\/([^/]+)/)?.[1];

            if (!currentActiveId || currentActiveId === "new") {
                return [...prev, { id, title, sourceType }];
            }

            return prev.map((t) =>
                t.id === currentActiveId
                    ? { id, title, sourceType }
                    : t
            );
        });

        if (id !== "new") {
            setLastActiveTabId(id);
        }

        if (!location.pathname.includes(id)) {
            navigate(`/notes/${id}`);
        }
    }, [navigate, location.pathname]);

    const closeTab = useCallback((id: string) => {
        setTabs((prev) => {
            const newTabs = prev.filter((t) => t.id !== id);

            if (activeTabId === id) {
                if (newTabs.length > 0) {
                    const nextTabId = newTabs[newTabs.length - 1].id;
                    setLastActiveTabId(nextTabId);
                    navigate(`/notes/${nextTabId}`);
                } else {
                    setLastActiveTabId(null);
                    navigate("/notes");
                }
            } else if (lastActiveTabId === id) {
                setLastActiveTabId(activeTabId && activeTabId !== "new" ? activeTabId : null);
            }

            return newTabs;
        });
    }, [navigate, activeTabId, lastActiveTabId]);

    const setActiveTab = useCallback((id: string) => {
        if (id !== "new") {
            setLastActiveTabId(id);
        }
        navigate(`/notes/${id}`);
    }, [navigate]);

    const createNewTab = useCallback(() => {
        navigate("/notes/new");
    }, [navigate]);

    const clearAllTabs = useCallback(() => {
        setTabs([]);
        setLastActiveTabId(null);
        localStorage.removeItem(TABS_STORAGE_KEY);
        localStorage.removeItem(LAST_ACTIVE_KEY);
    }, []);

    const value = useMemo(() => ({
        tabs,
        activeTabId,
        lastActiveTabId,
        openNoteInCurrentTab,
        closeTab,
        setActiveTab,
        createNewTab,
        clearAllTabs,
    }), [
        tabs,
        activeTabId,
        lastActiveTabId,
        openNoteInCurrentTab,
        closeTab,
        setActiveTab,
        createNewTab,
        clearAllTabs,
    ]);

    return (
        <TabsContext.Provider value={value}>
            {children}
        </TabsContext.Provider>
    );
}