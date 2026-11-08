// Shown when the user closes a calculator with calculations that aren't saved
// to a profile yet. They can sign in with Google or just type their name.
import React, { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isGoogleConfigured, signInWithGoogle } from "@/lib/googleAuth";
import { dismissSavePrompt, profileFromName, saveToProfile, useHistory, type Profile } from "@/lib/history";

interface SaveCalculationsDialogProps {
  open: boolean;
  /** Called after saving (true) or choosing "Not now" / dismissing (false). */
  onFinished: (saved: boolean) => void;
  /** Wording: closing the calculator vs. opening the dialog from History. */
  reason?: "close" | "manual";
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const SaveCalculationsDialog: React.FC<SaveCalculationsDialogProps> = ({ open, onFinished, reason = "close" }) => {
  const { entries, unsavedCount } = useHistory();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const googleReady = isGoogleConfigured();

  const finish = (profile: Profile) => {
    saveToProfile(profile);
    toast.success(`Saved ${unsavedCount} calculation${unsavedCount === 1 ? "" : "s"} for ${profile.name}`);
    setName("");
    onFinished(true);
  };

  const onGoogle = async () => {
    setBusy(true);
    try {
      finish(await signInWithGoogle());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const onSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) finish(profileFromName(name));
  };

  const recent = entries.filter((e) => e.profileId === null).slice(0, 3);
  const notNow = () => {
    dismissSavePrompt();
    onFinished(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && notNow()}>
      <DialogContent className="max-w-[26rem] gap-3 rounded-2xl p-5 sm:p-6">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle>Save your calculations?</DialogTitle>
          <DialogDescription>
            {reason === "close" ? "Before you go: you" : "You"} have {unsavedCount} unsaved calculation
            {unsavedCount === 1 ? "" : "s"}. Add your name or sign in with Google to keep them.
          </DialogDescription>
        </DialogHeader>

        {recent.length > 0 && (
          <ul className="min-w-0 space-y-1.5 rounded-lg bg-muted/60 p-3 font-mono text-xs text-muted-foreground">
            {recent.map((e) => (
              <li key={e.id} className="min-w-0" title={`${e.expression} = ${e.result}`}>
                <span className="line-clamp-2 [overflow-wrap:anywhere]">{e.expression}</span>
                <span className="block truncate font-semibold text-foreground">= {e.result}</span>
              </li>
            ))}
            {unsavedCount > recent.length && <li>…and {unsavedCount - recent.length} more</li>}
          </ul>
        )}

        <Button
          variant="outline"
          className="h-auto min-h-10 w-full gap-2 whitespace-normal"
          onClick={onGoogle}
          disabled={busy || !googleReady}
          title={googleReady ? undefined : "Add VITE_GOOGLE_CLIENT_ID to .env to enable Google sign-in"}
        >
          <GoogleIcon />
          {busy ? "Opening Google…" : "Continue with Google"}
        </Button>
        {!googleReady && (
          <p className="-mt-2 text-center text-xs text-muted-foreground">
            Google sign-in isn't set up for this build yet. Use your name for now.
          </p>
        )}

        <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSaveName} className="flex min-w-0 gap-2">
          <Input
            className="min-w-0"
            autoFocus
            placeholder="Your name"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            aria-label="Your name"
          />
          <Button type="submit" disabled={!name.trim()} className="bg-brand-blue hover:bg-brand-blue/90">
            Save
          </Button>
        </form>

        <p className="-mt-1 text-xs text-muted-foreground">
          Saved in this browser only. A name has no password, so anyone using this browser could open it.
        </p>

        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" size="sm" onClick={notNow} className="h-auto whitespace-normal text-muted-foreground">
            Not now (keep them on this device only)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveCalculationsDialog;
