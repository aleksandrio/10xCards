import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePasswordSchema } from "@/lib/schemas";
import { toast } from "sonner";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const result = updatePasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement Supabase password update
      // const { error } = await supabase.auth.updateUser({
      //   password: result.data.password,
      // });
      //
      // if (error) throw error;
      //
      // toast.success("Password updated successfully");
      // window.location.href = "/dashboard";

      // Placeholder for UI demonstration
      toast.success("Password update functionality will be implemented in the next phase");
      // eslint-disable-next-line no-console
      console.log("Password update requested");
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Failed to update password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Set a new password</h1>
        <p className="text-muted-foreground">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-md bg-destructive/10 border border-destructive p-3">
            <p className="text-sm text-destructive">{errors.form}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            New Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Create a new password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm New Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-destructive">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Updating password..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
