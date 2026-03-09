import { RegisterForm } from "@/modules/auth";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-200">
            <RegisterForm />
        </div>
    );
}