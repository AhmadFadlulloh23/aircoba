
"use client";

import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, UserCircle, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout, getCurrentUser } from "@/lib/auth"; // Simulated auth
import { useEffect, useState } from "react";
import type { User } from "@/types";
import Link from "next/link";

export function Header() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // If no user, redirect to login, but only if not already on login/register page
      // to prevent redirect loops if Header is somehow rendered there.
      // However, typically Header is only on protected routes.
      if (typeof window !== 'undefined' && !['/login', '/register'].includes(window.location.pathname)) {
        router.replace("/login");
      }
    }
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const userName = currentUser?.name || "User";
  const userEmail = currentUser?.email || "";
  const avatarFallback = userName.substring(0, 1).toUpperCase() || "U";
  const avatarTextFallback = currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : (currentUser?.email ? currentUser.email.substring(0,1).toUpperCase() : "U");


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" aria-label="Dashboard Home">
          <AppLogo size="compact" />
        </Link>
        
        <div className="flex items-center space-x-4">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser.photoUrl || `https://avatar.vercel.sh/${userEmail}.png?text=${avatarTextFallback}`} alt={userName} />
                    <AvatarFallback>{avatarTextFallback}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="py-2">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/profile')} className="py-2">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="py-2">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Button asChild>
                <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
