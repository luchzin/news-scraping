"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AdminShell from "@/components/AdminShell";
import ToggleSwitch from "@/components/ToggleSwitch";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [fetchScheduleEnabled, setFetchScheduleEnabled] = useState(true);

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["dark_mode", "fetch_schedule"])
      .then(({ data }) => {
        for (const row of data ?? []) {
          if (row.key === "dark_mode") setDarkMode(row.value === true || row.value === "true");
          if (row.key === "fetch_schedule") {
            const v = row.value as any;
            setFetchScheduleEnabled(Boolean(v?.enabled));
          }
        }
      });
  }, []);

  async function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    await supabase.from("settings").update({ value: next }).eq("key", "dark_mode");
  }

  async function toggleFetchSchedule() {
    const next = !fetchScheduleEnabled;
    setFetchScheduleEnabled(next);
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "fetch_schedule")
      .single();
    const current = (data?.value as any) ?? {};
    await supabase
      .from("settings")
      .update({ value: { ...current, enabled: next } })
      .eq("key", "fetch_schedule");
  }

  return (
    <AuthGuard>
      <AdminShell title="Settings" subtitle="Platform preferences">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
            <div>
              <p className="text-sm font-semibold">Dark Mode</p>
              <p className="text-xs text-gray-500">Turn into dark or light page</p>
            </div>
            <ToggleSwitch checked={darkMode} onChange={toggleDarkMode} />
          </div>
          <div className="flex items-center justify-between px-5 py-5">
            <div>
              <p className="text-sm font-semibold">Fetch schedule</p>
              <p className="text-xs text-gray-500">Set schedule to fetch news daily</p>
            </div>
            <ToggleSwitch checked={fetchScheduleEnabled} onChange={toggleFetchSchedule} />
          </div>
        </div>
      </AdminShell>
    </AuthGuard>
  );
}
