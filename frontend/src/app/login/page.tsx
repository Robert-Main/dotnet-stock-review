"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { fieldError, fieldErrorsMatchAny } from "@/lib/formErrors";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] =
    useState<ApiError["errors"]>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors(undefined);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-16 flex w-full max-w-md flex-col gap-8 sm:mt-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-xl shadow-emerald-500/25">
          <TrendingUp size={28} strokeWidth={2.5} />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500">
          Sign in to browse markets and manage your portfolio.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rise-in flex flex-col gap-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-sm"
      >
        {error && !fieldErrorsMatchAny(fieldErrors, ["email", "password"]) && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <Input
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError(fieldErrors, "email")}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError(fieldErrors, "password")}
        />
        <Button type="submit" loading={submitting} className="w-full py-2.5">
          Sign in
        </Button>
        <p className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
