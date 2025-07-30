
import React, { useState } from "react";
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { InferOutput } from "valibot"
import { email, object, string, pipe, safeParse } from "valibot"
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/utils/firebase';

export const Route = createFileRoute('/login')({
  component: Authentication,
});


function Authentication() {
  // const { user, signOut } = useAuth();
  // const testProtectedEndpoint = async () => {
  //   const user = auth.currentUser;
  //   if (!user) {
  //     alert("You must be logged in to test the protected endpoint.");
  //     return;
  //   }
  //   const idToken = await user.getIdToken();
  //   try {
  //     const response = await fetch("http://localhost:8000/api/protected", {
  //       headers: { Authorization: `Bearer ${idToken}` },
  //     });
  //     if (!response.ok) throw new Error("Unauthorized or error");
  //     const data = await response.json();
  //     alert("Protected endpoint response: " + JSON.stringify(data));
  //   } catch (err) {
  //     alert("Error: " + err);
  //   }
  // };
    return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </a>
        <LoginForm />
      </div>
    </div>
  )
}

const AuthSchema = object({
  email: pipe(string(), email()),
  password: string(),
})

type AuthForm = InferOutput<typeof AuthSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    // Validate the form data against the schema
    const result = safeParse(AuthSchema, { email, password });
    
    if (!result.success) {
      // Handle validation errors
      console.error("Validation errors:", result.issues);
      // You can display these errors to the user
      return;
    }
    
    // If validation passes, result.output contains the validated data
    const validatedData: AuthForm = result.output;
    console.log("Validated data:", validatedData);
    
    // Now you can safely use the validated data
    // e.g., call your authentication function
    // await signIn(validatedData.email, validatedData.password);
  }

  const handleGoogleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Google sign-in clicked");
    
    setIsSigningIn(true);
    
    try {
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        console.log("User:", result.user);
        toast.success("Successfully signed in!");
        
        // Wait for auth state to be fully updated
        await new Promise(resolve => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
              unsubscribe();
              resolve(user);
            }
          });
        });
        
        navigate({ to: "/projects" });
      } else {
        toast.error("Failed to sign in with Google");
      }
    } catch (error: any) {
      console.error("Sign-in error:", error);
      toast.error("Failed to sign in with Google");
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full hover:bg-gray-50 hover:border-gray-300 transition-colors"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    Login with Google
                  </>
                )}
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}


