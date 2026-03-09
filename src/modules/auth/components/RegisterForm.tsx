import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";

export const RegisterForm = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Пароли не совпадают");
            return;
        }

        setIsLoading(true);

        try {
            await register({ email, password });
            navigate("/login");
        } catch (err: unknown) {
            console.error("Registration error", err);

            if (err instanceof Error) {
                setError(err.message || "Ошибка при регистрации. Возможно, email уже занят.");
            } else {
                setError("Ошибка при регистрации. Возможно, email уже занят.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-card text-card-foreground p-8 rounded-lg border border-border shadow-sm">
            <div className="text-center mb-8">
                <div className="h-12 w-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-sm">
                    N
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Создать аккаунт</h1>
                <p className="text-sm text-muted-foreground mt-2">Начните работу с NeuroNotes</p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="pl-10 bg-background"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Пароль</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="pl-10 bg-background"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Подтвердите пароль</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="pl-10 bg-background"
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "Создание..." : "Зарегистрироваться"}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                    Войти
                </Link>
            </div>
        </div>
    );
};