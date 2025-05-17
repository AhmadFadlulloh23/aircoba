import { AppLogo } from "@/components/AppLogo";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-6">
      <AppLogo size="large" className="mb-10" />
      <LoginForm />
    </main>
  );
}
