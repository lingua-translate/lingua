import { FolderKanban } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <ComingSoon
      icon={FolderKanban}
      title="Projects"
      description="Self-contained workspaces that remember their languages, glossaries, translation memory, and preferences across every document."
      planned={[
        "Create, duplicate, archive, pin, tag, and colour-label projects",
        "Per-project defaults inherited by new translations",
        "Continuous autosave with clear sync status",
        "Version history you can compare and restore",
      ]}
    />
  );
}
