import { BookMarked } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Glossaries" };

export default function GlossariesPage() {
  return (
    <ComingSoon
      icon={BookMarked}
      title="Glossaries"
      description="Define preferred translations for domain terms and enforce them consistently across a project."
      planned={[
        "Personal, project, and organisation glossary scopes",
        "One-click term extraction from any document",
        "Prioritised terminology enforcement with conflict alerts",
        "Import and export in common industry formats",
      ]}
    />
  );
}
