import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, MainLayout, TabsProvider } from "@/modules/layout";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NoteWorkspace from "@/pages/dashboard/NoteWorkspace";
import GlobalChatPage from "@/pages/chat/GlobalChatPage";
import ProfilePage from "@/pages/profile/ProfilePage.tsx";
import SettingsPage from "@/pages/settings/SettingsPage.tsx";

export const AppRouter = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
                <Route element={
                    <TabsProvider>
                        <MainLayout />
                    </TabsProvider>
                }>
                    <Route index element={<NoteWorkspace />} />

                    <Route path="/notes/:id" element={<NoteWorkspace />} />

                    <Route path="/chat" element={<GlobalChatPage />} />

                    <Route path="/profile" element={<ProfilePage />} />

                    <Route path="/settings" element={<SettingsPage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Route>
        </Routes>
    );
};