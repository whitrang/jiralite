"use client";

import { LayoutGrid, Users, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/api/auth";

const getAvatarUrl = (name: string, fallbackImage?: string | null) => {
  if (fallbackImage) return fallbackImage;
  // UI Avatars generates consistent avatars based on name
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=150&bold=true`;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  async function loadUserInfo() {
    try {
      console.log("🔍 [loadUserInfo] Starting...");
      const userId = await getCurrentUserId();
      console.log("🔍 [loadUserInfo] userId:", userId);

      if (!userId) {
        console.log("❌ [loadUserInfo] No userId, redirecting to login");
        router.push("/login");
        return;
      }

      // Check if user exists in public.users
      console.log("🔍 [loadUserInfo] Checking if user exists in public.users...");
      const { data: userData, error } = await supabase
        .from("users")
        .select("email, name, profile_image")
        .eq("id", userId)
        .single();

      console.log("🔍 [loadUserInfo] Query result - userData:", userData, "error:", error);

      // If user doesn't exist in public.users, create it (for OAuth users)
      if (error && error.code === 'PGRST116') {
        console.log("⚠️ [loadUserInfo] User not found in public.users (PGRST116), creating user...");
        const { data: { user } } = await supabase.auth.getUser();
        console.log("🔍 [loadUserInfo] Auth user:", user);

        if (user) {
          const name = user.user_metadata?.name ||
                       user.user_metadata?.full_name ||
                       user.email?.split('@')[0] ||
                       'User';

          const provider = user.app_metadata?.provider || 'email';

          console.log("🔍 [loadUserInfo] Attempting to insert user with:", {
            id: user.id,
            email: user.email,
            name,
            auth_provider: provider
          });

          const { data: insertData, error: insertError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            name: name,
            auth_provider: provider,
            profile_image: user.user_metadata?.avatar_url || null,
          }).select();

          if (insertError) {
            console.error("❌ [loadUserInfo] Error creating user:", insertError);
          } else {
            console.log("✅ [loadUserInfo] User created successfully:", insertData);
          }

          // Set user info from auth metadata
          setUserEmail(user.email || "");
          setUserName(name);
          setUserProfileImage(user.user_metadata?.avatar_url || null);
          console.log("✅ [loadUserInfo] User state set from auth metadata");
        } else {
          // No user in auth, redirect to login
          console.log("❌ [loadUserInfo] No auth user found, redirecting to login");
          router.push("/login");
        }
      } else if (error) {
        // Some other error occurred
        console.error("❌ [loadUserInfo] Error fetching user data:", error);
        router.push("/login");
      } else if (userData) {
        // User exists, set the data
        console.log("✅ [loadUserInfo] User found in public.users, setting state");
        setUserEmail(userData.email || "");
        setUserName(userData.name || "");
        setUserProfileImage(userData.profile_image || null);
      }
    } catch (error) {
      console.error("❌ [loadUserInfo] Caught error:", error);
      router.push("/login");
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutGrid,
      href: "/dashboard",
    },
    {
      name: "Projects",
      icon: LayoutGrid,
      href: "/projects",
    },
    {
      name: "Teams",
      icon: Users,
      href: "/teams",
    }
    // {
    //   name: "Invites",
    //   icon: UserPlus,
    //   href: "/invites",
    // },
    // {
    //   name: "Profile",
    //   icon: User,
    //   href: "/profile",
    // },
    // {
    //   name: "Notifications",
    //   icon: Bell,
    //   href: "/notifications",
    // },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-6 px-3">
        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info and Logout */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <img
                src={getAvatarUrl(userName || "User", userProfileImage)}
                alt={userName || "User"}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
