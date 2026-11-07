// Closing a calculator: if there are unsaved calculations and nobody is signed
// in, show the "Save your calculations?" popup first, then close.
import React, { useState } from "react";
import SaveCalculationsDialog from "@/components/SaveCalculationsDialog";
import { shouldPromptToSave, type CalculatorType } from "@/lib/history";

export const useSaveOnClose = (close: (type: CalculatorType) => void) => {
  const [pending, setPending] = useState<CalculatorType | null>(null);

  const requestClose = (type: CalculatorType) => {
    if (shouldPromptToSave()) setPending(type);
    else close(type);
  };

  const dialog = (
    <SaveCalculationsDialog
      open={pending !== null}
      reason="close"
      onFinished={() => {
        const type = pending;
        setPending(null);
        if (type) close(type);
      }}
    />
  );

  return { requestClose, dialog };
};
