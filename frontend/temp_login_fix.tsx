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
    setIsSigningIn(true);
    
    try { 
      // First, try to sign in with existing credentials
      const result = await signInWithEmailAndPassword(auth, validatedData.email, validatedData.password);
      
      if (result.user) {
        // Check if email is verified
        if (!result.user.emailVerified) {
          // Send verification email if not already sent
          await sendEmailVerification(result.user);
          toast.info("Please check your email and verify your account before continuing.");
          setNeedsEmailVerification(true);
          setIsSigningIn(false);
          return;
        }
        
        // Email is verified, handle database update and proceed
        await handleEmailVerification(result.user);
      } else {
        throw new Error("Failed to sign in with email and password");
      }
    } catch (error: any) {
      console.error("Sign-in error:", error);
      
      // Handle invalid credentials (could be wrong password OR user doesn't exist)
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        // Instead of automatically creating an account, let user choose
        toast.error("Invalid email or password. Don't have an account?", {
          action: {
            label: 'Sign Up',
            onClick: async () => {
              try {
                toast.info("Creating your account...");
                const createResult = await createUserWithEmailAndPassword(
                  auth, 
                  validatedData.email, 
                  validatedData.password
                );
                
                if (createResult.user) {
                  // Send verification email for new users
                  await sendEmailVerification(createResult.user);
                  toast.success("Account created! Please check your email to verify your account before signing in.");
                  setIsSigningIn(false);
                  return;
                }
              } catch (createError: any) {
                console.error("Account creation error:", createError);
                handleCreateAccountError(createError);
              }
            },
          },
        });
      } else {
        // Handle other specific Firebase auth errors
        handleFirebaseAuthError(error);
      }
      
      setIsSigningIn(false);
    }
  }

  // Helper function to handle account creation errors
  const handleCreateAccountError = (error: any) => {
    if (error.code === 'auth/weak-password') {
      toast.error("Password should be at least 6 characters long");
    } else if (error.code === 'auth/email-already-in-use') {
      toast.error("An account with this email already exists. Try signing in instead.");
    } else if (error.code === 'auth/invalid-email') {
      toast.error("Please enter a valid email address");
    } else if (error.code === 'auth/operation-not-allowed') {
      toast.error("Email/password accounts are not enabled. Please contact support.");
    } else {
      toast.error("Failed to create account. Please try again.");
    }
  };

  // Helper function to handle Firebase auth errors
  const handleFirebaseAuthError = (error: any) => {
    if (error.code === 'auth/wrong-password') {
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
  };
