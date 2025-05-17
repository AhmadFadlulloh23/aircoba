// src/components/profile/ProfilePageClient.tsx
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image'; // Import next/image
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/types';
import { Loader2, UserCircle2 as UserIcon } from 'lucide-react'; // Renamed to avoid conflict

export function ProfilePageClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
          <CardDescription>User data could not be loaded. Please try logging in again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const avatarFallbackText = user.name ? user.name.substring(0, 2).toUpperCase() : (user.email ? user.email.substring(0,1).toUpperCase() : 'U');

  return (
    <Card className="w-full max-w-2xl mx-auto mt-10 shadow-xl rounded-lg overflow-hidden">
      <CardHeader className="items-center text-center bg-card p-8">
        <Avatar className="h-32 w-32 mb-4 ring-4 ring-primary ring-offset-background ring-offset-2">
          {/* 
            AvatarImage will attempt to load user.photoUrl. 
            If it fails or user.photoUrl is undefined, it will then try the vercel avatar.
            AvatarFallback will be used if both AvatarImage sources fail.
          */}
          <AvatarImage 
            src={user.photoUrl || `https://avatar.vercel.sh/${user.email}.png?text=${avatarFallbackText}`} 
            alt={user.name || 'User Avatar'} 
            data-ai-hint={user.photoUrl && user.photoUrl.includes('placehold.co') ? 'person portrait' : undefined}
          />
          <AvatarFallback className="text-4xl bg-muted">
            {/* Display initials if photoUrl is not available or fails to load */}
            {avatarFallbackText}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl font-bold text-primary">{user.name || 'User Profile'}</CardTitle>
        <CardDescription className="text-muted-foreground">View and manage your profile information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">Full Name</Label>
          <Input id="fullName" value={user.name || 'N/A'} readOnly className="text-lg bg-input border-border focus:ring-primary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email Address</Label>
          <Input id="email" type="email" value={user.email} readOnly className="text-lg bg-input border-border focus:ring-primary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idNumber" className="text-sm font-medium text-muted-foreground">ID Number (NIK/NIM/NIP)</Label>
          <Input id="idNumber" value={user.idNumber || 'N/A'} readOnly className="text-lg bg-input border-border focus:ring-primary" />
        </div>
         {/* You can add an "Edit Profile" button or functionality here in the future */}
      </CardContent>
    </Card>
  );
}
