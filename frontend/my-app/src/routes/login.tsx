
import { createFileRoute } from '@tanstack/solid-router';
import type { SubmitHandler } from "@modular-forms/solid"
import { createForm } from "@modular-forms/solid"
import { TbBrandGithub, TbLoader } from "solid-icons/tb"
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../utils/firebase';
import { cn } from '../components/ui';
import { buttonVariants } from '../components/ui/button';
import { Button } from '../components/ui/button';
import { Grid } from '../components/ui/grid';
import { TextField, TextFieldInput, TextFieldLabel } from '../components/ui/text-field';

export const Route = createFileRoute('/login')({
  component: Authentication,
});


function Authentication() {
  const { user, signOut } = useAuth();
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
    <>
      <div class="md:hidden">
        <img
          src="/examples/authentication-light.png"
          width={1280}
          height={843}
          alt="Authentication"
          class="block dark:hidden"
        />
        <img
          src="/examples/authentication-dark.png"
          width={1280}
          height={843}
          alt="Authentication"
          class="hidden dark:block"
        />
      </div>
      <div class="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <a
          href="/examples/authentication"
          class={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute right-4 top-4 md:right-8 md:top-8"
          )}
        >
          Login
        </a>
        <div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div class="absolute inset-0 bg-zinc-900" />
          <div class="relative z-20 flex items-center text-lg font-medium">
            Acme Inc
          </div>
          <div class="relative z-20 mt-auto">
            <blockquote class="space-y-2">
              <p class="text-lg">
                &ldquo;This library has saved me countless hours of work and helped me deliver
                stunning designs to my clients faster than ever before.&rdquo;
              </p>
              <footer class="text-sm">Sofia Davis</footer>
            </blockquote>
          </div>
        </div>
        <div class="lg:p-8">
          <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div class="flex flex-col space-y-2 text-center">
              <h1 class="text-2xl font-semibold tracking-tight">Create an account</h1>
              <p class="text-sm text-muted-foreground">
                Enter your email below to create your account
              </p>
              {user() && user()?.email && (
                <div class="flex flex-col items-center gap-2 mt-2">
                  <span class="text-green-600">Logged in as: {user()?.email}</span>
                  <Button variant="outline" onClick={signOut}>Logout</Button>
                </div>
              )}
            </div>
            <UserAuthForm />
            {/* <Button class="mt-4" onClick={testProtectedEndpoint}>
                Test Protected Endpoint
              </Button> */}
            <p class="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <a href="/terms" class="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" class="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function UserAuthForm() {
  const [authForm, { Form, Field }] = createForm<AuthForm>()

  const handleSubmit: SubmitHandler<AuthForm> = () => {
    return new Promise((resolve) => setTimeout(resolve, 2000))
  }

  return (
    <div class="grid gap-6">
      <Form onSubmit={handleSubmit}>
        <Grid class="gap-4">
          <Field name="email">
            {(_, props) => (
              <TextField class="gap-1">
                <TextFieldLabel class="sr-only">Email</TextFieldLabel>
                <TextFieldInput {...props} type="email" placeholder="me@email.com" />
              </TextField>
            )}
          </Field>
          <Button type="submit" disabled={authForm.submitting}>
            {authForm.submitting && <TbLoader class="mr-2 size-4 animate-spin" />}
            Login
          </Button>
        </Grid>
      </Form>
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <span class="w-full border-t" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={authForm.submitting}>
        {authForm.submitting ? (
          <TbLoader class="mr-2 size-4 animate-spin" />
        ) : (
          <TbBrandGithub class="mr-2 size-4" />
        )}{" "}
        Github
      </Button>
    </div>
  )
}


// VALIDATION

import type { InferOutput } from "valibot"
import { email, object, string, pipe } from "valibot"

const AuthSchema = object({
  email: pipe(string(), email())
})

type AuthForm = InferOutput<typeof AuthSchema>