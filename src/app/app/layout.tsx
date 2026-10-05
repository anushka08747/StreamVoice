import { FlaskConical } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { SAMPLE_DATA_LABEL } from "@/lib/store/seed";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:card focus:p-3">Skip to content</a>
      <Sidebar />
      <div className="min-w-0 flex-1">
        <div role="note" className="mx-4 mt-4 flex items-center gap-2 rounded-2xl bg-warn-soft px-4 py-2 text-sm font-medium text-[#7A4A06] lg:ml-2 lg:mr-6">
          <FlaskConical size={16} aria-hidden /> {SAMPLE_DATA_LABEL}
        </div>
        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-8 lg:pl-2 lg:pr-6">{children}</main>
      </div>
    </div>
  );
}
