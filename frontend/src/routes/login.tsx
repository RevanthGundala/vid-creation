
import React, { useState, useEffect } from "react";
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
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, type User, getAuth, signInWithPopup } from 'firebase/auth';
import { toast } from 'sonner';
import { fetchClient } from "@/hooks";
import { auth } from "../utils/firebase";

export const Route = createFileRoute('/login')({
  component: Authentication,
});


function Authentication() {
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
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const navigate = useNavigate();

  const handleEmailVerification = async (user: User) => {
    try {
      await user.reload();
      
      if (user.emailVerified) {
        // TODO: Send a proper 200 success/error response. Currently sends an id token back.
        const response = await fetchClient.POST("/auth/email", {
          email: user.email!,
        });
        setNeedsEmailVerification(false);
        navigate({ to: "/projects" });
      } else {
        toast.error("Please verify your email before continuing.");
      }
    } catch (error) {
      console.error("Email verification error:", error);
      toast.error("Failed to verify email. Please try again.");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    const result = safeParse(AuthSchema, { email, password });
    
    if (!result.success) {
      console.error("Validation errors:", result.issues);
      toast.error("Please enter a valid email and password");
      return;
    }
    
    const validatedData: AuthForm = result.output;
    setIsSigningIn(true);
    
    try {
      if (isSignUpMode) {
        const createResult = await createUserWithEmailAndPassword(
          auth, 
          validatedData.email, 
          validatedData.password
        );
        
        if (createResult.user) {
          await sendEmailVerification(createResult.user);
          toast.success("Please check your email to verify your account before signing in.");
          setIsSigningIn(false);
          return;
        }
      } else {
        const result = await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);
        
        if (result.user) {
          if (!result.user.emailVerified) {
            await sendEmailVerification(result.user);
            toast.info("Please check your email and verify your account before continuing.");
            setNeedsEmailVerification(true);
            setIsSigningIn(false);
            return;
          }
          await handleEmailVerification(result.user);
        } else {
          throw new Error("Failed to sign in with email and password");
        }
      }
    } catch (error: any) {
      if (isSignUpMode) {
        if (error.code === 'auth/weak-password') {
          toast.error("Password should be at least 6 characters long");
        } else if (error.code === 'auth/email-already-in-use') {
          toast.error("An account with this email already exists");
        } else if (error.code === 'auth/invalid-email') {
          toast.error("Please enter a valid email address");
        } else if (error.code === 'auth/operation-not-allowed') {
          toast.error("Email/password accounts are not enabled. Please contact support.");
        } else {
          toast.error("Failed to create account. Please try again.");
        }
      } else {
        if (error.code === 'auth/user-not-found') {
          toast.error("No account found with this email address");
        } else if (error.code === 'auth/wrong-password') {
          toast.error("Incorrect password. Please try again.");
        } else if (error.code === 'auth/invalid-email') {
          toast.error("Please enter a valid email address");
        } else if (error.code === 'auth/too-many-requests') {
          toast.error("Too many failed attempts. Please try again later.");
        } else if (error.code === 'auth/user-disabled') {
          toast.error("This account has been disabled. Please contact support.");
        } else {
          toast.error("Failed to sign in. Please try again.");
        }
      }
      
      setIsSigningIn(false);
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsResetting(true);
    
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      if (error.code === 'auth/user-not-found') {
        toast.error("No account found with this email address");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("Please enter a valid email address");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoogleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSigningIn(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const result = await signInWithPopup(auth, provider);
      console.log("result", result);
      navigate({ to: "/projects" });
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        console.log('Popup closed before completing sign-in.');
        toast.error("Sign in cancelled");
        setIsSigningIn(false);
        return;
      }
      console.error("Sign-in error:", error);
      toast.error("Failed to sign in with Google");
      setIsSigningIn(false);
    }
  }

  useEffect(() => {
      const handleRedirectResult = async () => {
        try {
          console.log("getRedirectResult");
          const result = await getRedirectResult(auth);
          console.log("result", result);
          if (result && result.user) {
            const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
            if (isNewUser) {
              toast.success("Account created successfully!");
            } else {
              toast.success("Successfully signed in!");
            }
            navigate({ to: "/projects" });
          }
        } catch (error: any) {
          console.error("Redirect result error:", error);
          toast.error("Failed to complete sign in");
        }
    };

    handleRedirectResult();
  }, [navigate]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {isSignUpMode ? "Create Account" : "Welcome"}
          </CardTitle>
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
                    {isSignUpMode ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    {isSignUpMode ? "Sign up with Google" : "Login with Google"}
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
                {!isSignUpMode && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {!showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full">
              {isSignUpMode ? "Sign Up" : "Login"}
            </Button>
            
            {needsEmailVerification && auth.currentUser && (
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => auth.currentUser && handleEmailVerification(auth.currentUser)}
                >
                  I've verified my email
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="w-full text-sm"
                  onClick={async () => {
                    if (!auth.currentUser) return;
                    try {
                      await sendEmailVerification(auth.currentUser);
                      toast.success("Verification email sent again!");
                    } catch (error) {
                      toast.error("Failed to send verification email");
                    }
                  }}
                >
                  Resend verification email
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {isSignUpMode ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUpMode(!isSignUpMode)}
            className="text-primary hover:underline font-medium"
          >
            {isSignUpMode ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
      
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Reset Password</h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                  className="flex-1 transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 transition-all duration-200 hover:scale-105"
                >
                  {isResetting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span className="animate-pulse">Sending...</span>
                    </div>
                  ) : (
                    <span className="transition-all duration-200">Send Reset Link</span>
                  )}
                </Button>
              </div>
            </form>
            
            <p className="text-sm text-gray-600 mt-4">
              We'll send you a link to reset your password. Check your email inbox after submitting.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}


