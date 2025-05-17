import { Header } from "@/components/dashboard/Header";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient"; // Changed to ProfilePageClient

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8 container mx-auto">
        <ProfilePageClient />
      </main>
    </div>
  );
}
