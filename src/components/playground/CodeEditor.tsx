"use client";

import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { EditorView } from "@codemirror/view";
import { useMemo } from "react";

const baseExtensions = [
  java(),
  EditorView.theme({
    "&": {
      fontSize: "13px",
      fontVariantLigatures: "none",
    },
    ".cm-content": {
      fontFamily: "var(--font-app-mono)",
      fontVariantLigatures: "none",
    },
    ".cm-gutters": {
      fontFamily: "var(--font-app-mono)",
    },
  }),
  EditorView.lineWrapping,
];

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, onRun, readOnly }: CodeEditorProps) {
  const extensions = useMemo(
    () => [
      ...baseExtensions,
      EditorView.domEventHandlers({
        keydown(event) {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            onRun?.();
            return true;
          }
          return false;
        },
      }),
    ],
    [onRun]
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme="dark"
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: !readOnly,
        indentOnInput: true,
        tabSize: 4,
      }}
      style={{ fontSize: "13px" }}
    />
  );
}
