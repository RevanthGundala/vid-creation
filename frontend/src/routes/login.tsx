//TODO: use our own - currently using WorkOS login page





// import React, { useState, useEffect } from "react";
// import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
// import { GalleryVerticalEnd } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import { toast } from 'sonner';
// import { useAuth } from "../contexts/auth-context";

// export const Route = createFileRoute('/login')({
//   component: Authentication,
//   validateSearch: (search) => ({
//     code: search.code as string | undefined,
//     state: search.state as string | undefined,
//     error: search.error as string | undefined,
//     error_description: search.error_description as string | undefined,
//   }),
// });

// function Authentication() {
//   return (
//     <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
//       <div className="flex w-full max-w-sm flex-col gap-6">
//         <a href="#" className="flex items-center gap-2 self-center font-medium">
//           <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
//             <GalleryVerticalEnd className="size-4" />
//           </div>
//           Acme Inc.
//         </a>
//         <LoginForm />
//       </div>
//     </div>
//   )
// }

// export function LoginForm({
//   className,
//   ...props
// }: React.ComponentProps<"div">) {
//   const [isSigningIn, setIsSigningIn] = useState(false);
//   const navigate = useNavigate();
//   const search = useSearch({ from: '/login' });
//   const { setUser } = useAuth();

//   // Handle WorkOS callback
//   useEffect(() => {
//     const handleWorkOSCallback = async () => {
//       if (search.code && search.state) {
//         setIsSigningIn(true);
//         try {
//           // Exchange the authorization code for user data
//           // TODO: Replace with your actual API endpoint
//           const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/workos/callback`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               code: search.code,
//               state: search.state,
//             }),
//             credentials: 'include', // Include cookies for session-based auth
//           });
          
//           if (response.ok) {
//             const userData = await response.json();
//             setUser(userData);
//             toast.success("Successfully signed in!");
//             navigate({ to: "/projects" });
//           } else {
//             throw new Error("Failed to authenticate");
//           }
//         } catch (error: any) {
//           console.error("WorkOS callback error:", error);
//           toast.error("Failed to complete sign in. Please try again.");
//         } finally {
//           setIsSigningIn(false);
//         }
//       } else if (search.error) {
//         console.error("WorkOS error:", search.error, search.error_description);
//         toast.error(search.error_description || "Authentication failed");
//       }
//     };

//     handleWorkOSCallback();
//   }, [search.code, search.state, search.error, search.error_description, navigate, setUser]);

//   const handleWorkOSSignIn = async () => {
//     setIsSigningIn(true);
//     try {
//       // Get the WorkOS authorization URL
//       // TODO: Replace with your actual API endpoint
//       const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/workos/authorize`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           redirect_uri: `${window.location.origin}/login`,
//         }),
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         if (data.url) {
//           // Redirect to WorkOS hosted UI
//           window.location.href = data.url;
//         } else {
//           throw new Error("Failed to get authorization URL");
//         }
//       } else {
//         throw new Error("Failed to get authorization URL");
//       }
//     } catch (error: any) {
//       console.error("WorkOS sign-in error:", error);
//       toast.error("Failed to start sign in process");
//       setIsSigningIn(false);
//     }
//   };

//   // If we're processing a callback, show loading state
//   if (search.code || search.error) {
//     return (
//       <div className={cn("flex flex-col gap-6", className)} {...props}>
//         <Card>
//           <CardHeader className="text-center">
//             <CardTitle className="text-xl">
//               Completing Sign In...
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center justify-center py-8">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className={cn("flex flex-col gap-6", className)} {...props}>
//       <Card>
//         <CardHeader className="text-center">
//           <CardTitle className="text-xl">
//             Welcome
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid gap-6">
//             <div className="flex flex-col gap-4">
//               <Button 
//                 type="button" 
//                 variant="outline" 
//                 className="w-full hover:bg-gray-50 hover:border-gray-300 transition-colors"
//                 onClick={handleWorkOSSignIn}
//                 disabled={isSigningIn}
//               >
//                 {isSigningIn ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
//                     Signing in...
//                   </>
//                 ) : (
//                   <>
//                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
//                       <path
//                         d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
//                         fill="currentColor"
//                       />
//                     </svg>
//                     Continue with Google
//                   </>
//                 )}
//               </Button>
              
//               <Button 
//                 type="button" 
//                 className="w-full"
//                 onClick={handleWorkOSSignIn}
//                 disabled={isSigningIn}
//               >
//                 {isSigningIn ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                     Signing in...
//                   </>
//                 ) : (
//                   "Sign in with Email"
//                 )}
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
      
//       <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
//         By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
//         and <a href="#">Privacy Policy</a>.
//       </div>
//     </div>
//   )
// }


