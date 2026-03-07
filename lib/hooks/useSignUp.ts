"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export function useSignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp(params: SignUpParams) {
    const { email, password, firstName, lastName } = params;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (signUpError) throw signUpError;
      // When the user signs up successfully, they are redirected to home
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return { signUp, isLoading, error };
}