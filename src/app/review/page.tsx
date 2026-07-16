import { GitCompare } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Review & Compare" };

export default function ReviewPage() {
  return (
    <ComingSoon
      icon={GitCompare}
      title="Review & Compare"
      description="A dedicated workspace to compare source and translation side by side, with an issue dashboard and quality score."
      planned={[
        "Synchronised side-by-side comparison",
        "Issue dashboard: grammar, terminology, formatting, confidence",
        "Confidence heatmap with jump-to-segment",
        "Accept, reject, or ignore every suggestion — you stay in control",
      ]}
    />
  );
}
