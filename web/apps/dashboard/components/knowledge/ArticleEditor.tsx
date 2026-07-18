"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import {
  createKnowledgeArticle,
  getKnowledgeArticle,
  updateKnowledgeArticle,
  type KnowledgeArticle,
  type KnowledgeArticleStatus,
} from "@supportflow/api-client";
import { Button, Input, Label } from "@supportflow/ui";
import { api } from "@/lib/api";

type ArticleEditorProps = {
  /** Article id, or "new" to create an article. */
  articleId: string;
};

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-brand-100 text-brand-700 dark:bg-brand-500/25 dark:text-brand-200"
          : "text-ink-soft hover:bg-line-soft dark:text-ink-faint dark:hover:bg-charcoal-muted"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: KnowledgeArticleStatus }) {
  const tone =
    status === "Published"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
      : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
  );
}

export function ArticleEditor({ articleId }: ArticleEditorProps) {
  const isNew = articleId === "new";
  const router = useRouter();

  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"Draft" | "Published" | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ link: false }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    onUpdate: () => setIsDirty(true),
    editorProps: {
      attributes: {
        "aria-label": "Article content",
      },
    },
  });

  // Load existing article, then hydrate the editor once both are ready.
  useEffect(() => {
    if (isNew) return;

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getKnowledgeArticle(api, articleId)
      .then((result) => {
        if (cancelled) return;
        setArticle(result);
        setTitle(result.title);
        setCategory(result.category ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Unable to load the article.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [articleId, isNew]);

  useEffect(() => {
    if (!editor || !article) return;
    editor.commands.setContent(article.content);
    setIsDirty(false);
  }, [editor, article]);

  // Warn before the tab closes with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const save = useCallback(
    async (status: KnowledgeArticleStatus) => {
      if (!editor || saving) return;

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setSaveError("Title is required.");
        return;
      }
      if (editor.isEmpty) {
        setSaveError("Article content cannot be empty.");
        return;
      }

      setSaving(status);
      setSaveError(null);
      try {
        const content = editor.getHTML();
        const trimmedCategory = category.trim();

        if (isNew) {
          const created = await createKnowledgeArticle(api, {
            title: trimmedTitle,
            content,
            category: trimmedCategory || undefined,
            publish: status === "Published",
          });
          setIsDirty(false);
          router.replace(`/knowledge/${created.id}`);
        } else {
          const updated = await updateKnowledgeArticle(api, articleId, {
            title: trimmedTitle,
            content,
            category: trimmedCategory || undefined,
            status,
          });
          setArticle(updated);
          setTitle(updated.title);
          setCategory(updated.category ?? "");
          setIsDirty(false);
        }
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Unable to save the article.");
      } finally {
        setSaving(null);
      }
    },
    [articleId, category, editor, isNew, router, saving, title],
  );

  const goBack = useCallback(() => {
    if (isDirty && !window.confirm("You have unsaved changes. Leave without saving?")) {
      return;
    }
    router.push("/knowledge");
  }, [isDirty, router]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }, [editor]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <p className="text-sm text-ink-muted">Loading article…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </div>
        <Link href="/knowledge" className="text-sm font-medium text-brand hover:underline">
          Back to Knowledge Base
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-line-soft dark:text-ink-faint dark:hover:bg-charcoal-muted"
            aria-label="Back to Knowledge Base"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="truncate text-xl font-semibold text-charcoal dark:text-white">
            {isNew ? "New article" : "Edit article"}
          </h1>
          {article && <StatusBadge status={article.status} />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving !== null}
            onClick={() => void save("Draft")}
          >
            {saving === "Draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving !== null}
            onClick={() => void save("Published")}
          >
            {saving === "Published"
              ? "Publishing…"
              : article?.status === "Published"
                ? "Save & publish"
                : "Publish"}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {saveError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <Label htmlFor="article-title">Title</Label>
          <Input
            id="article-title"
            placeholder="e.g. How to reset your password"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setIsDirty(true);
            }}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="article-category">Category</Label>
          <Input
            id="article-category"
            placeholder="Optional, e.g. Billing"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setIsDirty(true);
            }}
            className="mt-1"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-charcoal-muted dark:bg-charcoal">
        <div
          role="toolbar"
          aria-label="Formatting"
          className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-soft px-2 py-1.5 dark:border-charcoal-muted dark:bg-charcoal-soft"
        >
          <ToolbarButton
            label="Bold"
            active={editor?.isActive("bold") ?? false}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor?.isActive("italic") ?? false}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            label="Strikethrough"
            active={editor?.isActive("strike") ?? false}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <span className="line-through">S</span>
          </ToolbarButton>
          <ToolbarButton
            label="Inline code"
            active={editor?.isActive("code") ?? false}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleCode().run()}
          >
            <span className="font-mono text-xs">{"</>"}</span>
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-line dark:bg-charcoal-muted" aria-hidden />

          <ToolbarButton
            label="Heading 2"
            active={editor?.isActive("heading", { level: 2 }) ?? false}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={editor?.isActive("heading", { level: 3 }) ?? false}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-line dark:bg-charcoal-muted" aria-hidden />

          <ToolbarButton
            label="Bullet list"
            active={editor?.isActive("bulletList") ?? false}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
              <path d="M9 6h12M9 12h12M9 18h12" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor?.isActive("orderedList") ?? false}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            active={editor?.isActive("blockquote") ?? false}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <span className="text-base leading-none">&ldquo;</span>
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-line dark:bg-charcoal-muted" aria-hidden />

          <ToolbarButton
            label={editor?.isActive("link") ? "Edit link" : "Add link"}
            active={editor?.isActive("link") ?? false}
            disabled={!editor}
            onClick={setLink}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Remove link"
            disabled={!editor || !editor.isActive("link")}
            onClick={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              <path d="M3 3l18 18" />
            </svg>
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-line dark:bg-charcoal-muted" aria-hidden />

          <ToolbarButton
            label="Undo"
            disabled={!editor || !editor.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            disabled={!editor || !editor.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 15-6.7L21 13" />
            </svg>
          </ToolbarButton>
        </div>

        <div className="sf-article-editor">
          <EditorContent editor={editor} />
        </div>
      </div>

      {article && (
        <p className="text-xs text-ink-muted">
          {article.chunkCount} search chunk{article.chunkCount === 1 ? "" : "s"} · Last updated{" "}
          {new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(article.updatedAt || article.createdAt))}
        </p>
      )}
    </div>
  );
}
