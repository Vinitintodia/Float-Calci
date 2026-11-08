// Slide-over list of past calculations, with the signed-in profile on top.
import React, { useState } from "react";
import { History, LogOut, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import SaveCalculationsDialog from "@/components/SaveCalculationsDialog";
import { clearVisibleHistory, deleteEntry, signOut, signOutAndDelete, useHistory, type CalculatorType } from "@/lib/history";
import { cn } from "@/lib/utils";

const LABEL: Record<CalculatorType, string> = { basic: "Basic", scientific: "Scientific", financial: "Financial" };

const timeAgo = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
};

interface HistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ open, onOpenChange }) => {
  const { profile, entries, unsavedCount } = useHistory();
  const [saveOpen, setSaveOpen] = useState(false);
  // Two-step confirms (browser confirm() pop-ups can be blocked inside the on-page calculator)
  const [confirming, setConfirming] = useState<"clear" | "delete" | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${text}`);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> History
            </SheetTitle>
            <SheetDescription>
              {profile ? "Saved to your profile on this device." : "Calculations are kept on this device."}
            </SheetDescription>
          </SheetHeader>

          {/* Profile */}
          <div className="flex items-center gap-3 rounded-xl border border-border p-3">
            {profile ? (
              <>
                {profile.picture ? (
                  <img src={profile.picture} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue/15 font-semibold text-brand-blue">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{profile.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.provider === "google" ? profile.email : "Name only (no password), on this device"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <p className="flex-1 text-sm text-muted-foreground">
                  {unsavedCount > 0 ? `${unsavedCount} unsaved calculation${unsavedCount === 1 ? "" : "s"}` : "Not signed in"}
                </p>
                <Button size="sm" className="bg-brand-blue hover:bg-brand-blue/90" onClick={() => setSaveOpen(true)} disabled={unsavedCount === 0}>
                  Save
                </Button>
              </>
            )}
          </div>

          {profile && (
            <div className="-mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
              <span>{profile.provider === "name" ? "Anyone using this browser can open a name profile." : "Saved only in this browser."}</span>
              <button
                onClick={() => (confirming === "delete" ? (signOutAndDelete(), setConfirming(null)) : setConfirming("delete"))}
                onBlur={() => setConfirming(null)}
                className={cn("font-medium hover:underline", confirming === "delete" ? "text-destructive" : "text-muted-foreground")}
              >
                {confirming === "delete" ? "Tap again to delete" : "Sign out & delete my data"}
              </button>
            </div>
          )}

          {/* Entries */}
          <div className="-mx-2 flex-1 overflow-y-auto px-2">
            {entries.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No calculations yet. Press = on any calculator and it shows up here.
              </p>
            ) : (
              <ul className="space-y-2">
                {entries.map((e) => (
                  <li key={e.id} className="group rounded-lg border border-border p-3 transition-colors hover:bg-accent/50">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-medium",
                          e.calculator === "basic" && "bg-brand-blue/10 text-brand-blue",
                          e.calculator === "scientific" && "bg-brand-purple-light/50 text-brand-purple-dark dark:text-brand-purple-medium",
                          e.calculator === "financial" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {LABEL[e.calculator]}
                      </span>
                      <span className="flex items-center gap-1">
                        {!e.profileId && <span className="text-amber-600 dark:text-amber-400">unsaved ·</span>}
                        {timeAgo(e.createdAt)}
                        <button
                          onClick={() => deleteEntry(e.id)}
                          className="ml-1 rounded p-0.5 opacity-0 hover:text-destructive group-hover:opacity-100"
                          aria-label="Delete"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>
                    <button onClick={() => copy(e.result)} className="block w-full text-left" title="Click to copy the result">
                      <p className="break-all font-mono text-xs text-muted-foreground">{e.expression}</p>
                      <p className="break-all font-mono text-base font-semibold">= {e.result}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {entries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-2 hover:text-destructive", confirming === "clear" ? "text-destructive" : "text-muted-foreground")}
              onClick={() => (confirming === "clear" ? (clearVisibleHistory(), setConfirming(null)) : setConfirming("clear"))}
              onBlur={() => setConfirming(null)}
            >
              <Trash2 className="h-4 w-4" /> {confirming === "clear" ? "Tap again to delete all of these" : "Clear history"}
            </Button>
          )}
        </SheetContent>
      </Sheet>

      <SaveCalculationsDialog open={saveOpen} reason="manual" onFinished={() => setSaveOpen(false)} />
    </>
  );
};

export default HistoryPanel;
