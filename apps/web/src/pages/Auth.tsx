import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Logo } from "../components/Brand";
import { api, ApiError } from "../lib/api";

export function Auth({ mode, onAuthed }: { mode: "login" | "register"; onAuthed: () => Promise<void> }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await (isLogin ? api.login(email, password) : api.register(email, password));
      await onAuthed();
      navigate("/app");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="rise w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <form onSubmit={submit} className="border border-line bg-panel p-6">
          <h1 className="text-xl font-semibold tracking-tight">{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            {isLogin ? "Sign in to change your events." : "So you can come back and change your events later."}
          </p>

          <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
          <Field
            label="Password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={isLogin ? undefined : 8}
            hint={isLogin ? undefined : "At least 8 characters"}
            value={password}
            onChange={setPassword}
          />

          {error && (
            <p role="alert" className="mb-4 border-l-2 border-[#FF5555] bg-[#FF5555]/10 px-3 py-2 text-sm text-[#ff8a8a]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gold py-2.5 text-sm font-semibold text-ink shadow-[inset_-3px_-3px_0_#0003,inset_3px_3px_0_#fff5] hover:brightness-110 active:translate-y-px disabled:opacity-60"
          >
            {busy ? "One sec…" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={isLogin ? "/register" : "/login"} className="text-fg underline-offset-2 hover:underline">
            {isLogin ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  onChange,
  ...input
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 flex justify-between text-xs font-medium text-muted">
        {label}
        {hint && <span className="font-normal text-faint">{hint}</span>}
      </span>
      <input
        {...input}
        required
        onChange={(e) => onChange(e.target.value)}
        className="slot w-full px-3 py-2.5 text-sm text-fg outline-none placeholder:text-faint focus:shadow-[inset_0_0_0_1px_var(--color-gold)]"
      />
    </label>
  );
}
