import { cn } from "@hypr/utils";

import { usePrepWizard, type PrepItem } from "./usePrepWizard";

function PrepItemRow({
  item,
  onToggle,
}: {
  item: PrepItem;
  onToggle: (id: string) => void;
}) {
  return (
    <label
      className={cn([
        "flex cursor-pointer items-start gap-2",
        "rounded-md p-2 hover:bg-muted/50",
      ])}
    >
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id)}
        className="mt-0.5 shrink-0"
      />
      <span
        className={cn([
          "text-sm leading-relaxed",
          item.checked && "text-muted-foreground line-through",
        ])}
      >
        {item.text}
      </span>
    </label>
  );
}

export function PrepWizard({ sessionId }: { sessionId: string }) {
  const {
    questions,
    checklist,
    isGenerating,
    generate,
    toggle,
    eventTitle,
    eventDescription,
    hasEvent,
  } = usePrepWizard(sessionId);

  if (!hasEvent) {
    return (
      <div
        className={cn([
          "flex items-center justify-center",
          "p-6 text-sm text-muted-foreground",
        ])}
      >
        Link a calendar event to use the preparation wizard.
      </div>
    );
  }

  const hasContent = questions.length > 0 || checklist.length > 0;

  return (
    <div className={cn(["flex flex-col gap-4", "p-4"])}>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">{eventTitle}</h3>
        {eventDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {eventDescription}
          </p>
        )}
      </div>

      {!hasContent && (
        <button
          onClick={generate}
          disabled={isGenerating}
          className={cn([
            "rounded-lg border px-4 py-2.5",
            "text-sm font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "disabled:opacity-50",
          ])}
        >
          {isGenerating ? "Generating preparation..." : "Generate Preparation"}
        </button>
      )}

      {questions.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">
            Questions to Ask
          </h4>
          {questions.map((q) => (
            <PrepItemRow key={q.id} item={q} onToggle={toggle} />
          ))}
        </div>
      )}

      {checklist.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">
            Preparation Checklist
          </h4>
          {checklist.map((c) => (
            <PrepItemRow key={c.id} item={c} onToggle={toggle} />
          ))}
        </div>
      )}

      {hasContent && (
        <button
          onClick={generate}
          disabled={isGenerating}
          className={cn([
            "rounded-md border px-3 py-1.5",
            "text-xs text-muted-foreground",
            "hover:bg-muted/50",
            "disabled:opacity-50",
          ])}
        >
          {isGenerating ? "Regenerating..." : "Regenerate"}
        </button>
      )}
    </div>
  );
}
