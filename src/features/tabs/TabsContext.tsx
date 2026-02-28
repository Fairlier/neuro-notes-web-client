// src/features/tabs/TabsContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface Tab {
    uid: string;
    noteId: string;
    title: string;
    url: string;
}

interface TabsContextType {
    tabs: Tab[];
    activeTabUid: string | null;
    createNewTab: () => void;
    openNoteInCurrentTab: (noteId: string, title: string) => void;  // ← ДОБАВЛЕНО
    updateCurrentTabNote: (noteId: string, title: string) => void;
    closeTab: (e: MouseEvent | null, uid: string) => void;
    setActiveTabUid: (uid: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const generateUid = () => Math.random().toString(36).substr(2, 9);

export const TabsProvider = ({ children }: { children: ReactNode }) => {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabUid, setActiveTabUid] = useState<string | null>(null);

    const activeTabUidRef = useRef<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Синхронизация Ref
    useEffect(() => {
        activeTabUidRef.current = activeTabUid;
    }, [activeTabUid]);

    // Инициализация при первом рендере
    useEffect(() => {
        if (tabs.length === 0) {
            const pathParts = location.pathname.split('/notes/');
            const noteId = pathParts[1] || 'new';
            const newUid = generateUid();
            const newTab: Tab = {
                uid: newUid,
                noteId: noteId === 'new' ? 'new' : noteId,
                title: noteId === 'new' ? 'Новая вкладка' : 'Загрузка...',
                url: noteId === 'new' ? '/notes/new' : `/notes/${noteId}`
            };
            setTabs([newTab]);
            setActiveTabUid(newUid);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Создание новой вкладки (кнопка "+")
    const createNewTab = useCallback(() => {
        const newUid = generateUid();
        const newTab: Tab = {
            uid: newUid,
            noteId: 'new',
            title: 'Новая вкладка',
            url: '/notes/new'
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabUid(newUid);
        navigate('/notes/new');
    }, [navigate]);

    // Открыть заметку В ТЕКУЩЕЙ вкладке (замена содержимого + навигация)
    const openNoteInCurrentTab = useCallback((noteId: string, title: string) => {
        const currentUid = activeTabUidRef.current;
        if (!currentUid) return;

        setTabs(prevTabs =>
            prevTabs.map(tab =>
                tab.uid === currentUid
                    ? { ...tab, noteId, title, url: `/notes/${noteId}` }
                    : tab
            )
        );
        navigate(`/notes/${noteId}`);
    }, [navigate]);

    // Обновить данные текущей вкладки (когда заметка загрузилась, без навигации)
    const updateCurrentTabNote = useCallback((noteId: string, title: string) => {
        const currentUid = activeTabUidRef.current;
        if (!currentUid) return;

        setTabs(prevTabs =>
            prevTabs.map(tab => {
                if (tab.uid === currentUid) {
                    // Обновляем только если это та же заметка или вкладка была "новой"
                    if (tab.noteId === noteId || tab.noteId === 'new') {
                        return { ...tab, noteId, title, url: `/notes/${noteId}` };
                    }
                }
                return tab;
            })
        );
    }, []);

    // Закрытие вкладки
    const closeTab = useCallback((e: MouseEvent | null, uid: string) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        const remainingTabs = tabs.filter(t => t.uid !== uid);

        // Закрываем последнюю вкладку — создаём пустую
        if (remainingTabs.length === 0) {
            const newUid = generateUid();
            const newTab: Tab = {
                uid: newUid,
                noteId: 'new',
                title: 'Новая вкладка',
                url: '/notes/new'
            };

            setTabs([newTab]);
            setActiveTabUid(newUid);
            navigate('/notes/new');
            return;
        }

        setTabs(remainingTabs);

        // Если закрыли активную — переключаемся
        if (uid === activeTabUid) {
            const tabIndex = tabs.findIndex(t => t.uid === uid);
            const newActiveTab = remainingTabs[tabIndex - 1] || remainingTabs[tabIndex] || remainingTabs[0];

            if (newActiveTab) {
                setActiveTabUid(newActiveTab.uid);
                navigate(newActiveTab.url);
            }
        }
    }, [tabs, activeTabUid, navigate]);

    return (
        <TabsContext.Provider value={{
            tabs,
            activeTabUid,
            createNewTab,
            openNoteInCurrentTab,  // ← ДОБАВЛЕНО
            updateCurrentTabNote,
            closeTab,
            setActiveTabUid
        }}>
            {children}
        </TabsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTabs = () => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("useTabs must be used within a TabsProvider");
    return context;
};