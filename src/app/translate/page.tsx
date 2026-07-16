import type { Metadata } from "next";
import { Translator } from "@/components/Translator";
import { isRealProviderConfigured } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Translator",
};

export default function TranslatePage() {
  const realProvider = isRealProviderConfigured();
  return (
    <>
      {!realProvider && (
        <div className="border-b border-warning/20 bg-warning/5 px-4 py-2.5 text-center text-xs text-warning md:px-6">
          Running on the mock provider — set <code className="font-mono">ANTHROPIC_API_KEY</code> to enable real Claude translation.
        </div>
      )}
      <Translator />
    </>
  );
}
