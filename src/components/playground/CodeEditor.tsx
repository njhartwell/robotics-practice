"use client";

import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { EditorView } from "@codemirror/view";
import { useMemo } from "react";

const extensions = [
  java(),
  EditorView.theme({
    "&": {
      fontSize: "13px",
      fontVariantLigatures: "none",
    },
    ".cm-content": {
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      fontVariantLigatures: "none",
    },
    ".cm-gutters": {
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
    },
  }),
  EditorView.lineWrapping,
];

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, readOnly }: CodeEditorProps) {
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
