"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKey,
  type CreatedApiKey,
} from "@supportflow/api-client";
import { Button, Input, Label } from "@supportflow/ui";
import { AiLoader } from "@/components/ui/AiLoader";
import { WidgetBrandingForm } from "@/components/settings/WidgetBrandingForm";
import { api } from "@/lib/api";

const WIDGET_SCRIPT_URL =
  process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL ?? "http://localhost:4173/widget.iife.js";

function buildEmbedScript(apiKey: string) {
  return `<script>
  (function(w,d,s,o,f,js,fjs){
    w['SupportFlow']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','sf','${WIDGET_SCRIPT_URL}'));
  sf('init', { apiKey: '${apiKey}' });
</script>`;
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export default function WidgetSettingsPage() {
  const [activeTab, setActiveTab] = useState<"keys" | "branding">("keys");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("Website widget");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState<"key" | "script" | null>(null);

  const embedKey = created?.apiKey ?? "pk_live_YOUR_KEY";
  const embedScript = useMemo(() => buildEmbedScript(embedKey), [embedKey]);

  const flashCopied = (kind: "key" | "script") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setKeys(await listApiKeys(api));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load API keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const result = await createApiKey(api, { name: name.trim() || "Website widget" });
      setCreated(result);
      setName("Website widget");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create API key.");
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = async (id: string) => {
    setError(null);
    try {
      await revokeApiKey(api, id);
      if (created?.id === id) setCreated(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke API key.");
    }
  };

  const onCopyKey = async () => {
    if (!created?.apiKey) return;
    try {
      await copyText(created.apiKey);
      flashCopied("key");
    } catch {
      setError("Unable to copy API key.");
    }
  };

  const onCopyScript = async () => {
    try {
      await copyText(embedScript);
      flashCopied("script");
    } catch {
      setError("Unable to copy embed script.");
    }
  };

  const hasKeys = keys.length > 0;

  const steps = [
    {
      title: "Generate a key",
      description: "Authenticates your widget",
      done: hasKeys,
    },
    {
      title: "Copy the snippet",
      description: "One script tag, that's it",
      done: Boolean(created),
    },
    {
      title: "Go live",
      description: "Chats land in your inbox",
      done: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section switcher */}
      <div
        role="tablist"
        aria-label="Widget settings sections"
        className="flex w-fit gap-1 rounded-xl bg-surface-soft p-1 dark:bg-charcoal-soft"
      >
        {(
          [
            { id: "keys", label: "API keys & embed" },
            { id: "branding", label: "Widget branding" },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-brand-700 shadow-sm ring-1 ring-line dark:bg-charcoal dark:text-brand-300 dark:ring-charcoal-muted"
                  : "text-ink-soft hover:text-ink dark:text-ink-faint dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "branding" && <WidgetBrandingForm />}

      {activeTab === "keys" && (
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

      {/* Setup steps */}
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={`flex items-center gap-3 rounded-2xl p-4 shadow-sm ring-1 transition-colors ${
              step.done
                ? "bg-brand-50 ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-500/30"
                : "bg-white ring-line dark:bg-charcoal dark:ring-charcoal-muted"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step.done
                  ? "bg-brand-500 text-white"
                  : "bg-surface-soft text-ink-muted dark:bg-charcoal-muted dark:text-ink-faint"
              }`}
            >
              {step.done ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m5 13 4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-charcoal dark:text-white">
                {step.title}
              </p>
              <p className="truncate text-xs text-ink-muted">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {created && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">Copy this key now — it will not be shown again.</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void onCopyKey()}>
              {copied === "key" ? "Copied" : "Copy key"}
            </Button>
          </div>
          <code className="mt-2 block break-all rounded-lg bg-white/80 px-2.5 py-2 text-xs">
            {created.apiKey}
          </code>
        </div>
      )}

      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        {/* API keys column */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-semibold text-charcoal dark:text-white">Widget API keys</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Embed keys authenticate the public chat widget. The full key is shown only once.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Label htmlFor="apiKeyName" className="text-xs">
                Key name
              </Label>
              <Input
                id="apiKeyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <Button type="button" size="sm" disabled={creating} onClick={() => void onCreate()}>
              {creating ? "Creating…" : "Generate key"}
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-line dark:border-charcoal-muted">
            {loading ? (
              <div className="flex justify-center py-8">
                <AiLoader size="sm" label="Loading keys" />
              </div>
            ) : keys.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <p className="text-sm font-medium text-charcoal dark:text-white">No API keys yet</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Generate your first key to activate the widget.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line dark:divide-charcoal-muted">
                {keys.map((key) => (
                  <li key={key.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-charcoal dark:text-white">
                        {key.name}
                      </p>
                      <p className="text-xs text-ink-muted">
                        <code className="text-[11px]">{key.keyPrefix}…</code> · created{" "}
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(key.createdAt))}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => void onRevoke(key.id)}>
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>

          {/* Good to know */}
          <div className="flex-1 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 18h6m-5 4h4M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.1 1 1.8V17h6v-.5c0-.7.4-1.4 1-1.8A7 7 0 0 0 12 2z" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-semibold text-charcoal dark:text-white">Good to know</h2>
                <p className="mt-0.5 text-xs text-ink-muted">A few tips before you embed.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                "The full key is shown only once — store it somewhere safe.",
                "Revoking a key instantly disables every widget using it.",
                "One key per website keeps things easy to rotate later.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft dark:text-ink-faint">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand-500" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Embed card */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line dark:bg-charcoal dark:ring-charcoal-muted">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-charcoal dark:text-white">Embed snippet</h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Paste before the closing <code>&lt;/body&gt;</code> tag of your site.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 whitespace-nowrap"
                onClick={() => void onCopyScript()}
              >
                {copied === "script" ? "Copied" : "Copy script"}
              </Button>
            </div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-charcoal p-3.5 text-[11px] leading-relaxed text-emerald-200/90">
              {embedScript}
            </pre>
            <p className="mt-2.5 text-[11px] text-ink-muted">
              {created
                ? "Script includes your newly generated key."
                : "Generate a key first, or replace pk_live_YOUR_KEY before embedding."}
            </p>
          </div>

          {/* Try it live */}
          <div className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-charcoal via-charcoal-soft to-charcoal p-5 ring-1 ring-brand-500/30">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 85% 15%, rgba(16,185,129,0.18), transparent 50%)",
              }}
            />
            <div className="relative flex h-full flex-col justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 [animation:sf-breathe_2s_ease-in-out_infinite]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Try the widget live</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                    Run{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-brand-300">
                      npm run dev:widget
                    </code>{" "}
                    and open the demo host page — messages land in your inbox.
                  </p>
                </div>
              </div>
              <a
                href="http://localhost:4173"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-600"
              >
                Open test page →
              </a>
            </div>
          </div>
        </section>
      </div>
        </div>
      )}
    </div>
  );
}
