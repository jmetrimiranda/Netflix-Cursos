"use client";

import { Button } from "@/components/ui/button";
import Link from "@tiptap/extension-link";
import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback } from "react";

type Props = {
  value: JSONContent | null;
  onChange: (doc: JSONContent | null) => void;
};

export function TiptapEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false, autolink: true })],
    content: value ?? { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const isEmpty =
        Array.isArray(json.content) &&
        json.content.length === 1 &&
        json.content[0]?.type === "paragraph" &&
        !json.content[0]?.content;
      onChange(isEmpty ? null : json);
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring prose prose-sm dark:prose-invert max-w-none",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL do link:", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <div className="h-40 rounded-md border border-input bg-muted/30" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bold") ? "secondary" : "outline"}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("italic") ? "secondary" : "outline"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "outline"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "outline"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bulletList") ? "secondary" : "outline"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • Lista
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("orderedList") ? "secondary" : "outline"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. Lista
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("link") ? "secondary" : "outline"}
          onClick={setLink}
        >
          Link
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
