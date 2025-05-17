import { AppLogo } from "@/components/AppLogo";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-6">
      <AppLogo size="large" className="mb-10" />
      <RegisterForm />
    </main>
  );
}
