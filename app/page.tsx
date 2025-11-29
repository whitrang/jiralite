"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function HomePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      router.push("/login");
    } finally {
      setCheckingAuth(false);
    }
  }

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

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Spinner size="lg" variant="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
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
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

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
    </div>
  );
}
