import { LoginForm } from "@/modules/auth";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-200">
            <LoginForm />
        </div>
    );
}