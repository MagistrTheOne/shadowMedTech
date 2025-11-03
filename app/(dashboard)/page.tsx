"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      switch (user.role) {
        case 'rep':
          router.push('/dashboard/rep');
          break;
        case 'trainer':
          router.push('/dashboard/trainer');
          break;
        case 'manager':
          router.push('/dashboard/manager');
          break;
        case 'admin':
          router.push('/dashboard/admin');
          break;
        default:
          router.push('/dashboard/rep'); // Default fallback
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
        <p className="text-slate-300">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
