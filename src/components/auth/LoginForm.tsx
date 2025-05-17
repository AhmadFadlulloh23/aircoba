"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/lib/auth"; // Simulated auth
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Use the simulated login function
      const normalizedEmail = data.email.trim();
      const result = await login(normalizedEmail, data.password);

      if (result.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user?.name || 'User'}!`,
        });
        router.push("/dashboard");
      } else {
        const errorMsg = result.error || "Login failed. Please check your credentials.";
        setErrorMessage(errorMsg);
        toast({
          title: "Login Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMsg = "An unexpected error occurred. Please try again.";
      setErrorMessage(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">Welcome Back!</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to access your Water Quality dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...form.register("email")}
              className="bg-[hsl(var(--input))] text-[hsl(var(--input-foreground))]"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...form.register("password")}
                className="bg-[hsl(var(--input))] text-[hsl(var(--input-foreground))]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
              </Button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive text-center">{errorMessage}</p>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-muted-foreground">
          New to Water Quality?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an Account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
