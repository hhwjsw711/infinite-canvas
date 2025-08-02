"use client";

import { z } from "zod";

import { useForm } from "react-hook-form";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";

const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(72, "Password must be less than 72 characters")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(
        /[!?@#$%^&*_]/,
        "Password must contain at least one special character",
      ),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function Signup() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    clearErrors();

    try {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("flow", "signUp");

      await signIn("password", formData);
      router.back();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError("root", {
          type: "server",
          message: error.message || "Registration failed. Please try again.",
        });
      } else {
        setError("root", {
          type: "server",
          message: "Registration failed. Please try again.",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errors.root && (
        <div className="mb-4 text-sm text-red-600">{errors.root.message}</div>
      )}

      <div className="flex flex-col space-y-1">
        <label htmlFor="email">Email address</label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <span className="text-sm text-red-600">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="password">Password</label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && (
          <span className="text-sm text-red-600">
            {errors.password.message}
          </span>
        )}
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="password_confirmation">Confirm Password</label>
        <Input
          id="password_confirmation"
          type="password"
          {...register("password_confirmation")}
          className={errors.password_confirmation ? "border-red-500" : ""}
        />
        {errors.password_confirmation && (
          <span className="text-sm text-red-600">
            {errors.password_confirmation.message}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4 pt-4">
        <Button type="submit" className="flex-grow" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}
