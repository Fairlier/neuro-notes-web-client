import { useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usersApi } from '@/modules/users';
import { useAuth } from '@/modules/auth';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const { i18n } = useTranslation();
    const { isAuthenticated } = useAuth();

    const { data: profile } = useQuery({
        queryKey: ['userProfile'],
        queryFn: usersApi.getProfile,
        enabled: isAuthenticated,
    });

    useEffect(() => {
        if (profile?.interfaceLanguage) {
            if (i18n.language !== profile.interfaceLanguage) {
                i18n.changeLanguage(profile.interfaceLanguage);
            }
        }
    }, [profile?.interfaceLanguage, i18n]);

    return <>{children}</>;
};