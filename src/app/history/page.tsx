import { History } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <ComingSoon
      icon={History}
      title="Translation History"
      description="A searchable record of everything you've translated, ready to restore, duplicate, or export."
      planned={[
        "Search and filter by language, date, and document type",
        "Restore or duplicate any previous translation",
        "Export individual results or in bulk",
      ]}
    />
  );
}
