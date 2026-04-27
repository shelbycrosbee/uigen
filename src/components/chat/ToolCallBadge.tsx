"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: string;
  result?: unknown;
  args: Record<string, unknown>;
}

interface ToolCallBadgeProps {
  tool: ToolInvocation;
}

function filename(path: unknown): string {
  if (typeof path !== "string" || !path) return "";
  return path.split("/").pop() || path;
}

export function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  const command = args.command as string | undefined;
  const file = filename(args.path);

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":    return `Creating ${file}`;
      case "str_replace":
      case "insert":    return `Editing ${file}`;
      case "view":      return `Reading ${file}`;
      default:          return `Processing ${file}`;
    }
  }

  if (toolName === "file_manager") {
    const newFile = filename(args.new_path);
    switch (command) {
      case "rename": return `Renaming ${file} to ${newFile}`;
      case "delete": return `Deleting ${file}`;
      default:       return `Managing ${file}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ tool }: ToolCallBadgeProps) {
  const label = getToolLabel(tool.toolName, tool.args);
  const done = tool.state === "result" && tool.result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
