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
import { registerSchema, type RegisterValues } from "@/lib/schemas";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function RegisterPage() {
  const toast = useToast();
  const { register: registerUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [banner, setBanner] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirm: "" },
  });

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const onSubmit = async (values: RegisterValues) => {
    setBanner(null);
    try {
      await registerUser(values.username, values.email, values.password);
      toast.success("Account created — welcome aboard!");
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMsg = syncServerErrors(
          err.errors,
          setError as unknown as ServerErrorSetter,
          ["username", "email", "password"]
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
    <div className="mx-auto mt-12 flex w-full max-w-md flex-col gap-8 sm:mt-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-xl shadow-emerald-500/25">
          <TrendingUp size={28} strokeWidth={2.5} />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
          Create your account
        </h1>
        <p className="text-sm text-zinc-500">
          Join StockReview to track stocks and share reviews.
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
          id="username"
          label="Username"
          autoComplete="username"
          placeholder="stocknerd"
          error={errors.username?.message}
          {...register("username")}
        />
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
          autoComplete="new-password"
          placeholder="At least 6 chars, incl. a digit, upper & symbol"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          id="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full py-2.5">
          Create account
        </Button>
        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
