// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabase";

// type Step = "email" | "code" | "password";

// export default function LoginPage() {
//   const router = useRouter();
//   const [step, setStep] = useState<Step>("email");
//   const [email, setEmail] = useState("");
//   const [code, setCode] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   async function handleSendCode(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);

//     const { error } = await supabase.auth.signInWithOtp({
//       email,
//       options: { shouldCreateUser: false }, // only existing admins can log in
//     });

//     setLoading(false);
//     if (error) {
//       setError(error.message);
//       return;
//     }
//     setStep("code");
//   }

//   async function handleVerifyCode(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);

//     const { error } = await supabase.auth.verifyOtp({
//       email,
//       token: code,
//       type: "email",
//     });

//     setLoading(false);
//     if (error) {
//       setError("That code didn't match. Check the email and try again.");
//       return;
//     }
//     setStep("password");
//   }

//   async function handleVerifyPassword(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);

//     const { error } = await supabase.auth.signInWithPassword({ email, password });

//     setLoading(false);
//     if (error) {
//       await supabase.auth.signOut();
//       setError("Incorrect password.");
//       setStep("email");
//       setCode("");
//       setPassword("");
//       return;
//     }
//     router.push("/dashboard");
//   }

//   async function handleResend() {
//     setError(null);
//     await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
//   }

//   return (
//     <div className="flex h-screen items-center justify-center bg-pagebg">
//       <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
//         <div className="mb-6 text-center">
//           <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
//             CCH
//           </div>
//           <h1 className="text-lg font-semibold">Cambodia Cyber Hub</h1>
//           <p className="text-sm text-gray-500">Admin Portal</p>
//         </div>

//         {step === "email" && (
//           <form onSubmit={handleSendCode}>
//             <label className="mb-1 block text-sm font-medium">Email</label>
//             <input
//               type="email"
//               required
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
//               placeholder="you@example.com"
//             />
//             {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white disabled:opacity-60"
//             >
//               {loading ? "Sending code…" : "Send code"}
//             </button>
//           </form>
//         )}

//         {step === "code" && (
//           <form onSubmit={handleVerifyCode}>
//             <p className="mb-4 text-sm text-gray-600">
//               We sent a 6-digit code to <span className="font-medium">{email}</span>.
//             </p>
//             <label className="mb-1 block text-sm font-medium">Code</label>
//             <input
//               type="text"
//               inputMode="numeric"
//               required
//               value={code}
//               onChange={(e) => setCode(e.target.value)}
//               className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm tracking-widest"
//               placeholder="123456"
//             />
//             {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
//             <button
//               type="submit"
//               disabled={loading}
//               className="mb-3 w-full rounded-md bg-brand py-2 text-sm font-semibold text-white disabled:opacity-60"
//             >
//               {loading ? "Verifying…" : "Verify code"}
//             </button>
//             <button
//               type="button"
//               onClick={handleResend}
//               className="w-full text-center text-sm text-blue-700"
//             >
//               Resend code
//             </button>
//           </form>
//         )}

//         {step === "password" && (
//           <form onSubmit={handleVerifyPassword}>
//             <p className="mb-4 text-sm text-gray-600">
//               Code confirmed. Now enter your password to finish signing in.
//             </p>
//             <label className="mb-1 block text-sm font-medium">Password</label>
//             <input
//               type="password"
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
//               placeholder="••••••••"
//             />
//             {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white disabled:opacity-60"
//             >
//               {loading ? "Signing in…" : "Sign in"}
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex h-screen items-center justify-center bg-pagebg">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
            CCH
          </div>
          <h1 className="text-lg font-semibold">Cambodia Cyber Hub</h1>
          <p className="text-sm text-gray-500">Admin Portal</p>
        </div>

        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="you@example.com"
        />

        <label className="mb-1 block text-sm font-medium">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="••••••••"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}