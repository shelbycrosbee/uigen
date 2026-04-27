import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolCallBadge, getToolLabel } from "../ToolCallBadge";

// --- getToolLabel unit tests ---

describe("getToolLabel", () => {
  test("str_replace_editor create", () => {
    expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
  });

  test("str_replace_editor str_replace", () => {
    expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Button.tsx" })).toBe("Editing Button.tsx");
  });

  test("str_replace_editor insert", () => {
    expect(getToolLabel("str_replace_editor", { command: "insert", path: "/components/Card.jsx" })).toBe("Editing Card.jsx");
  });

  test("str_replace_editor view", () => {
    expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Reading App.jsx");
  });

  test("str_replace_editor unknown command falls back", () => {
    expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Processing App.jsx");
  });

  test("file_manager rename", () => {
    expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming old.jsx to new.jsx");
  });

  test("file_manager delete", () => {
    expect(getToolLabel("file_manager", { command: "delete", path: "/App.jsx" })).toBe("Deleting App.jsx");
  });

  test("unknown tool falls back to toolName", () => {
    expect(getToolLabel("some_other_tool", { command: "foo", path: "/x.js" })).toBe("some_other_tool");
  });

  test("path without leading slash", () => {
    expect(getToolLabel("str_replace_editor", { command: "create", path: "App.jsx" })).toBe("Creating App.jsx");
  });
});

// --- ToolCallBadge render tests ---

describe("ToolCallBadge", () => {
  test("shows label and green dot when done", () => {
    render(
      <ToolCallBadge
        tool={{ toolName: "str_replace_editor", state: "result", result: "ok", args: { command: "create", path: "/App.jsx" } }}
      />
    );
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
    // spinner should NOT be present
    expect(document.querySelector(".animate-spin")).toBeNull();
  });

  test("shows label and spinner while pending", () => {
    render(
      <ToolCallBadge
        tool={{ toolName: "str_replace_editor", state: "call", args: { command: "str_replace", path: "/components/Button.tsx" } }}
      />
    );
    expect(screen.getByText("Editing Button.tsx")).toBeDefined();
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  test("shows spinner when state is result but result is null", () => {
    render(
      <ToolCallBadge
        tool={{ toolName: "str_replace_editor", state: "result", result: null, args: { command: "create", path: "/App.jsx" } }}
      />
    );
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  test("shows file_manager delete label", () => {
    render(
      <ToolCallBadge
        tool={{ toolName: "file_manager", state: "result", result: "ok", args: { command: "delete", path: "/old.jsx" } }}
      />
    );
    expect(screen.getByText("Deleting old.jsx")).toBeDefined();
  });
});
