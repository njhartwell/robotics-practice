"use client";

/**
 * Renders exercise instruction text with basic markdown support:
 * - Inline `code` backticks
 * - ```code blocks```
 * - Line breaks from \n
 */
export function InstructionText({ text }: { text: string }) {
  // Split on code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-sm text-muted mt-1 space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          // Code block
          const code = part.slice(3, -3).replace(/^\w*\n/, ""); // strip language hint
          return (
            <pre
              key={i}
              className="bg-[#1e293b] text-[#e2e8f0] rounded-md p-3 text-xs font-mono overflow-x-auto"
            >
              <code>{code.trim()}</code>
            </pre>
          );
        }

        // Inline content: split on backticks for inline code
        return (
          <span key={i} className="whitespace-pre-line">
            {renderInlineCode(part)}
          </span>
        );
      })}
    </div>
  );
}

function renderInlineCode(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-[var(--border)] px-1.5 py-0.5 rounded text-[0.85em] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
