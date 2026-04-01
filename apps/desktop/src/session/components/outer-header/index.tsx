import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@hypr/utils";

import { FolderChain } from "./folder";
import { ListenButton } from "./listen";
import { MetadataButton } from "./metadata";
import { OverflowButton } from "./overflow";

import { PrepWizard } from "~/session/components/prep-wizard";
import { useSessionEvent } from "~/store/tinybase/hooks";
import type { EditorView } from "~/store/zustand/tabs/schema";
import { useListener } from "~/stt/contexts";

export function OuterHeader({
  sessionId,
  currentView,
}: {
  sessionId: string;
  currentView: EditorView;
}) {
  const [prepExpanded, setPrepExpanded] = useState(false);
  const sessionEvent = useSessionEvent(sessionId);
  const sessionMode = useListener((state) => state.getSessionMode(sessionId));
  const showPrepToggle = !!sessionEvent && sessionMode !== "active";

  return (
    <div className="w-full pt-1">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <FolderChain sessionId={sessionId} />
        </div>

        <div className="flex shrink-0 items-center">
          {showPrepToggle && (
            <button
              onClick={() => setPrepExpanded((v) => !v)}
              className={cn([
                "flex items-center gap-1 rounded-md px-2 py-1",
                "text-xs text-muted-foreground",
                "hover:bg-muted/50",
              ])}
            >
              Prep
              {prepExpanded
                ? <ChevronUpIcon className="h-3 w-3" />
                : <ChevronDownIcon className="h-3 w-3" />}
            </button>
          )}
          <ListenButton sessionId={sessionId} />
          <MetadataButton sessionId={sessionId} />
          <OverflowButton sessionId={sessionId} currentView={currentView} />
        </div>
      </div>

      {showPrepToggle && prepExpanded && (
        <div className={cn(["mt-2 rounded-lg border", "bg-background"])}>
          <PrepWizard sessionId={sessionId} />
        </div>
      )}
    </div>
  );
}
