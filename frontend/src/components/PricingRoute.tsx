import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Profile {
  billing_type: "paid" | "free";
  credits: number;
}

export default function PricingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    setProfile(undefined);

    if (!user) {
      setProfile(null);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/supabase/user/${user.id}?table=profiles`
        );

        if (!res.ok) {
          setProfile(null);
          return;
        }

        const data = await res.json();

        if (!data?.error) {
          setProfile({
            billing_type: data.billing_type?.toLowerCase(),
            credits: data.credits,
          });
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
    })();
  }, [user]);

  if (loading || profile === undefined) return <div />;

  if (user && profile?.billing_type === "paid") return <Navigate to="/dashboard" replace />;

  return children;
}
