"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  /** Render the label in the item's own script direction (for endonyms). */
  rtl?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  value: string;
  onChange: (value: string) => void;
  /** Optional custom trigger content; defaults to the selected item's label. */
  triggerContent?: ReactNode;
  ariaLabel: string;
  className?: string;
  align?: "start" | "end";
  widthClass?: string;
}

/**
 * Lightweight accessible dropdown (button + listbox popover) with keyboard
 * support, click-outside, and Escape to close. Kept dependency-free to stay
 * fully self-contained.
 */
export function Dropdown({
  items,
  value,
  onChange,
  triggerContent,
  ariaLabel,
  className,
  align = "start",
  widthClass = "w-72",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = items.find((i) => i.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = items.findIndex((i) => i.value === value);
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [open, items, value]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(items[activeIndex].value);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="min-w-0 flex-1 truncate">
          {triggerContent ?? selected?.label ?? "Select…"}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-panel animate-fade-in scrollbar-slim",
            widthClass,
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {items.map((item, idx) => {
            const isSelected = item.value === value;
            const isActive = idx === activeIndex;
            return (
              <li key={item.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => commit(item.value)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    isActive ? "bg-surface-2" : "hover:bg-surface-2",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted ring-1 ring-border">
                          {item.badge}
                        </span>
                      )}
                    </span>
                    {item.sublabel && (
                      <span
                        className="mt-0.5 block truncate text-xs text-muted"
                        dir={item.rtl ? "rtl" : undefined}
                      >
                        {item.sublabel}
                      </span>
                    )}
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
