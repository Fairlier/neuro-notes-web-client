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
    ensureActiveTab: (noteId: string, title: string, url: string) => void;
    closeTab: (e: MouseEvent | null, uid: string) => void;
    setActiveTabUid: (uid: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider = ({ children }: { children: ReactNode }) => {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabUid, setActiveTabUid] = useState<string | null>(null);

    const activeTabUidRef = useRef<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const generateUid = () => Math.random().toString(36).substr(2, 9);

    // Синхронизация Ref
    useEffect(() => {
        activeTabUidRef.current = activeTabUid;
    }, [activeTabUid]);

    // Инициализация
    useEffect(() => {
        if (tabs.length === 0) {
            const pathParts = location.pathname.split('/notes/');
            const noteId = pathParts[1] || 'new';
            const newUid = generateUid();
            const newTab: Tab = {
                uid: newUid,
                noteId: noteId,
                title: noteId === 'new' ? 'Новая вкладка' : 'Загрузка...',
                url: location.pathname
            };
            setTabs([newTab]);
            setActiveTabUid(newUid);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 1. Создание новой вкладки
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

    // 2. Обновление текущей активной вкладки
    const ensureActiveTab = useCallback((noteId: string, title: string, url: string) => {
        setTabs(prevTabs => {
            const currentUid = activeTabUidRef.current;

            // Если активная вкладка есть - обновляем её
            if (currentUid && prevTabs.some(t => t.uid === currentUid)) {
                return prevTabs.map(tab => {
                    if (tab.uid === currentUid) {
                        if (tab.noteId === noteId && tab.title === title && tab.url === url) return tab;
                        return { ...tab, noteId, title, url };
                    }
                    return tab;
                });
            }

            // Если вкладки нет (потерялась), но список пуст или всего 1 элемент - используем его
            if (prevTabs.length === 1) {
                const singleTab = prevTabs[0];
                // Синхронизируем ID если он сбился
                if (currentUid !== singleTab.uid) {
                    // Используем setTimeout только как fallback, в нормальном потоке это не должно срабатывать часто
                    setTimeout(() => setActiveTabUid(singleTab.uid), 0);
                }
                return [{ ...singleTab, noteId, title, url }];
            }

            // Fallback: создаем новую, если совсем все потерялось
            const newUid = generateUid();
            setTimeout(() => setActiveTabUid(newUid), 0);
            return [...prevTabs, { uid: newUid, noteId, title, url }];
        });
    }, []);

    // 3. Закрытие вкладки (ИСПРАВЛЕНО)
    const closeTab = useCallback((e: MouseEvent | null, uid: string) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        // Мы используем текущее состояние tabs из замыкания, чтобы выполнить логику синхронно
        // Сначала вычисляем, каким будет новый массив
        const remainingTabs = tabs.filter(t => t.uid !== uid);

        // СЦЕНАРИЙ 1: Мы закрываем ПОСЛЕДНЮЮ вкладку
        if (remainingTabs.length === 0) {
            const newUid = generateUid();
            const newTab = {
                uid: newUid,
                noteId: 'new',
                title: 'Новая вкладка',
                url: '/notes/new'
            };

            // ВАЖНО: Обновляем всё СИНХРОННО. Никаких setTimeout.
            setTabs([newTab]);
            setActiveTabUid(newUid);
            navigate('/notes/new');
            return;
        }

        // СЦЕНАРИЙ 2: Обычное закрытие
        setTabs(remainingTabs);

        // Если закрыли активную, нужно переключиться
        if (uid === activeTabUid) {
            const tabIndex = tabs.findIndex(t => t.uid === uid);
            // Пытаемся взять левого соседа, если нет - берем того, кто встал на это место (справа)
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
            ensureActiveTab,
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