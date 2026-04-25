"use client";

import Link from "@tiptap/extension-link";
import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type Props = {
  content: JSONContent | null;
  className?: string;
};

export function TiptapRenderer({ content, className }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: true, autolink: true })],
    content: content ?? { type: "doc", content: [{ type: "paragraph" }] },
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          className ??
          "prose prose-sm prose-invert max-w-none text-sm text-foreground/90 focus:outline-none",
      },
    },
  });

  if (!editor) {
    return <div className="h-24 animate-pulse rounded bg-muted/40" />;
  }

  return <EditorContent editor={editor} />;
}
