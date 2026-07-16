import { Database } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Translation Memory" };

export default function MemoryPage() {
  return (
    <ComingSoon
      icon={Database}
      title="Translation Memory"
      description="Reuse approved source–target segments across your projects, with context-aware matching that never reuses blindly."
      planned={[
        "Exact, context, and fuzzy match detection",
        "Configurable update policy (auto, ask, manual)",
        "Match provenance: project, date, and last editor",
        "Private by default — never shared without permission",
      ]}
    />
  );
}
