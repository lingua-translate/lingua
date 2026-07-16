import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      description="Account, workspace, privacy, and accessibility preferences — all in one place."
      planned={[
        "Default languages, mode, and export format",
        "Theme and accessibility preferences",
        "Data retention and privacy controls",
        "Security: sessions, passkeys, and multi-factor authentication",
      ]}
    />
  );
}
