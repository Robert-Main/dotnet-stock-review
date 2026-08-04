"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { syncServerErrors, type ServerErrorSetter } from "@/lib/formErrors";
import { loginSchema, type LoginValues } from "@/lib/schemas";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [banner, setBanner] = useState<string | null>(null);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const onSubmit = async (values: LoginValues) => {
    setBanner(null);
    try {
      await login(values.email, values.password);
      toast.success("Logged in successfully!");
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMsg = syncServerErrors(
          err.errors,
          setError as unknown as ServerErrorSetter,
          ["email", "password"]
        );
        if (fieldMsg) {
          toast.error(fieldMsg);
        } else {
          toast.error(err.message);
          setBanner(err.message);
        }
      } else {
        toast.error("Something went wrong. Try again.");
        setBanner("Something went wrong. Try again.");
      }
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
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="rise-in flex flex-col gap-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-sm"
      >
        {banner && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {banner}
          </div>
        )}
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full py-2.5">
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
