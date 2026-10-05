"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardCheck, Home, Map, Menu, PanelLeftClose, PanelLeftOpen, PlusCircle, UserRound, X } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";
import { LogoMark } from "./Logo";
import { cx, Segmented } from "./ui";

const COLLAPSE_KEY = "streamvoice.sidebar.collapsed";

export function Sidebar() {
  const path = usePathname();
  const { profile, setProfile, observations } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const pending = observations.filter((o) => o.status === "flagged").length;

  useEffect(() => { try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* ignore */ } }, []);
  useEffect(() => setOpen(false), [path]);
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* ignore */ } return !c; });

  const items = [
    { href: "/app", label: "Stream map", icon: Map, active: path === "/app" || path.startsWith("/app/streams") },
    { href: "/app/contribute", label: "Contribute", icon: PlusCircle, active: path.startsWith("/app/contribute") },
    { href: "/app/review", label: "Review queue", icon: ClipboardCheck, active: path.startsWith("/app/review"), count: pending },
    { href: "/app/profile", label: "Profile", icon: UserRound, active: path.startsWith("/app/profile") },
  ];

  const nav = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <Link href="/" className={cx("flex items-center gap-3 px-2 py-1", compact && "justify-center px-0")} title="Back to home">
        <LogoMark size={40} />
        {!compact && <span><span className="block text-lg font-bold leading-tight">StreamVoice</span><span className="block text-xs text-muted">Stream health briefings</span></span>}
      </Link>
      <nav aria-label="App" className="mt-8 flex flex-col gap-1.5">
        {items.map((it) => (
          <Link key={it.href} href={it.href} aria-current={it.active ? "page" : undefined} title={compact ? it.label : undefined}
            className={cx("flex min-h-[48px] items-center gap-3 rounded-2xl px-4 font-medium transition-colors",
              compact && "justify-center px-0",
              it.active ? "card !rounded-2xl font-semibold text-ink" : "text-ink-soft hover:bg-[rgba(255,255,255,0.6)] hover:text-primary")}>
            <it.icon size={20} aria-hidden className={it.active ? "text-primary" : ""} />
            {!compact && <span className="flex-1">{it.label}</span>}
            {!compact && !!it.count && <span className="chip bg-warn-soft text-[#9A5B05]" aria-label={`${it.count} waiting`}>{it.count}</span>}
          </Link>
        ))}
      </nav>
      <div className="mt-auto space-y-4 border-t border-[var(--line)] pt-4">
        {!compact && (
          <div>
            <p className="eyebrow mb-2 px-2">Role</p>
            <Segmented label="Role" value={profile.role} onChange={(role) => setProfile({ role })}
              options={[{ value: "volunteer", label: "Volunteer" }, { value: "reviewer", label: "Reviewer" }]} />
          </div>
        )}
        <Link href="/" className={cx("btn btn-ghost btn-sm w-full !justify-start", compact && "!justify-center")} title="Home page"><Home size={18} aria-hidden />{!compact && "Home page"}</Link>
        <button type="button" onClick={toggle} className={cx("btn btn-ghost btn-sm hidden w-full !justify-start lg:inline-flex", compact && "!justify-center")}
          aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}>
          {compact ? <PanelLeftOpen size={18} aria-hidden /> : <><PanelLeftClose size={18} aria-hidden />Collapse</>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--line)] bg-[rgba(241,243,253,0.9)] px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-bold"><LogoMark size={32} />StreamVoice</Link>
        <button type="button" className="btn btn-secondary btn-sm" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(true)}><Menu size={18} aria-hidden />Menu</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-[rgba(21,25,53,0.25)]" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside id="mobile-nav" className="card absolute bottom-3 left-3 top-3 w-[280px] p-5">
            <button type="button" className="btn btn-ghost btn-sm absolute right-3 top-3" aria-label="Close menu" onClick={() => setOpen(false)}><X size={18} /></button>
            {nav(false)}
          </aside>
        </div>
      )}
      <aside className={cx("card sticky top-4 m-4 hidden h-[calc(100vh-2rem)] shrink-0 p-5 transition-[width] lg:block", collapsed ? "w-[88px]" : "w-[280px]")}>
        {nav(collapsed)}
      </aside>
    </>
  );
}
