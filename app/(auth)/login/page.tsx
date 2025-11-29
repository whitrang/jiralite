"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { email, password } = formData;

      // Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!data.user) {
        throw new Error("Login failed");
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const fillTestAccount = (email: string, password: string) => {
    setFormData({ email, password });
    setError("");
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Spinner size="lg" variant="primary" />
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6">Log In</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Log In
        </button>
      </form>

      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="mt-4 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>

      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-medium">
          Sign up
        </Link>
      </p>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Test Accounts</h2>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fillTestAccount("john@vietvibe.com", "1q1q1q1q")}
            className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">john@vietvibe.com</p>
                <p className="text-xs text-gray-600">Password: 1q1q1q1q</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Owner
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fillTestAccount("sarah@vietvibe.com", "1q1q1q1q")}
            className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">sarah@vietvibe.com</p>
                <p className="text-xs text-gray-600">Password: 1q1q1q1q</p>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                Admin
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fillTestAccount("alex@vietvibe.com", "1q1q1q1q")}
            className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">alex@vietvibe.com</p>
                <p className="text-xs text-gray-600">Password: 1q1q1q1q</p>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                Member
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
