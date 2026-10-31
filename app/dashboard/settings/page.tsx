"use client";

import { motion } from "framer-motion";
import { User, Bell, Shield, CreditCard, LogOut, Moon, Monitor, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/(auth)/actions";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUser();
  }, [supabase.auth]);

  const handlePasswordReset = async () => {
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/settings`,
      });
      if (error) {
        alert("Error sending password reset email: " + error.message);
      } else {
        alert("Password reset email sent! Check your inbox.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const SectionHeading = ({ title, description }: { title: string, description: string }) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      <p className="text-sm text-text-muted mt-1">{description}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-text-muted mt-2">Manage your account preferences and application settings.</p>
      </div>

      <div className="space-y-10">
        {/* Account Section */}
        <section className="bg-surface border border-white/5 rounded-3xl p-8">
          <SectionHeading title="Account Details" description="Update your personal information." />
          <div className="space-y-6 max-w-2xl">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  disabled
                  value={email}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-muted cursor-not-allowed"
                />
                <p className="text-xs text-text-muted mt-2">Email changes require email verification.</p>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Password</label>
                <button 
                  onClick={handlePasswordReset}
                  disabled={isResetting}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-medium transition-colors text-left flex items-center justify-between disabled:opacity-50"
                >
                  <span>••••••••••••</span>
                  <span className="text-primary text-xs">{isResetting ? 'Sending...' : 'Change'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-surface border border-white/5 rounded-3xl p-8">
          <SectionHeading title="Preferences" description="Customize your Velora workspace." />
          
          <div className="space-y-8 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-white mb-4">Notifications</label>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-white">Email Updates</div>
                    <div className="text-xs text-text-muted">Receive application status changes via email.</div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${notifications.email ? 'bg-primary' : 'bg-white/10'}`} onClick={() => setNotifications(p => ({...p, email: !p.email}))}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifications.email ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-white">Push Notifications</div>
                    <div className="text-xs text-text-muted">Receive in-browser alerts for upcoming interviews.</div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${notifications.push ? 'bg-primary' : 'bg-white/10'}`} onClick={() => setNotifications(p => ({...p, push: !p.push}))}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifications.push ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="bg-surface border border-white/5 rounded-3xl p-8">
          <div className="flex items-start justify-between">
            <SectionHeading title="Subscription" description="Manage your billing and tier." />
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-full text-xs font-bold text-primary uppercase tracking-wider">
                Pro Plan
              </div>
              <span className="text-xs text-text-muted font-medium italic">(in work)</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-text-muted" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Visa ending in 4242</div>
              <div className="text-xs text-text-muted">Next billing date: Jan 1, 2027</div>
            </div>
            <button className="ml-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors text-white">
              Manage Billing
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
          <SectionHeading title="Danger Zone" description="Destructive actions and account removal." />
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors text-white"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium transition-colors text-red-500">
              <Shield className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
