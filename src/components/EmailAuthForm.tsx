import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { Button } from "src/components/ui/button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

type Values = z.infer<typeof schema>;

interface Props {
  endpoint: string;
}

export function EmailAuthForm({ endpoint }: Props) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const [pending, setPending] = React.useState<"signin" | "signup" | null>(null);

  const submit = async (type: "signin" | "signup") => {
    const valid = await form.trigger();
    if (!valid) return;
    const values = form.getValues();
    setPending(type);

    const fd = new FormData();
    fd.set("email", values.email);
    fd.set("password", values.password);
    fd.set("type", type);

    try {
      const res = await fetch(endpoint, { method: "POST", body: fd, redirect: "follow" });
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      const text = await res.text();
      if (!res.ok) {
        toast.error(text || "Something went wrong");
      } else {
        toast.success(text || "Done");
      }
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setPending(null);
    }
  };

  return (
    <form className="space-y-4" onSubmit={e => e.preventDefault()}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="pt-2 flex flex-col gap-2">
        <Button
          type="button"
          className="w-full"
          disabled={!!pending}
          onClick={() => submit("signin")}
        >
          {pending === "signin" ? "Signing in…" : "Sign in"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={!!pending}
          onClick={() => submit("signup")}
        >
          {pending === "signup" ? "Creating…" : "Create an account"}
        </Button>
      </div>
    </form>
  );
}
