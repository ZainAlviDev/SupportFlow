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

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-charcoal dark:text-white">Widget API keys</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Embed keys authenticate the public chat widget. The full key is shown only once.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {created && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">Copy this key now — it will not be shown again.</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void onCopyKey()}>
              {copied === "key" ? "Copied" : "Copy key"}
            </Button>
          </div>
          <code className="mt-2 block break-all rounded bg-white/80 px-2 py-1.5 text-xs">
            {created.apiKey}
          </code>
        </div>
      )}

      <div className="flex items-end gap-2">
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

      <div className="rounded-lg border border-line dark:border-charcoal-muted">
        {loading ? (
          <p className="px-3 py-4 text-sm text-ink-muted">Loading keys…</p>
        ) : keys.length === 0 ? (
          <p className="px-3 py-4 text-sm text-ink-muted">No API keys yet.</p>
        ) : (
          <ul className="divide-y divide-line dark:divide-charcoal-muted">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-charcoal dark:text-white">
                    {key.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {key.keyPrefix}… · created{" "}
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

      <div className="rounded-lg border border-line p-3 dark:border-charcoal-muted">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-ink-soft dark:text-ink-faint">Embed snippet</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void onCopyScript()}>
            {copied === "script" ? "Copied" : "Copy script"}
          </Button>
        </div>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded bg-line-soft p-2 text-[11px] text-ink dark:bg-charcoal-soft dark:text-ink-faint">
          {embedScript}
        </pre>
        <p className="mt-2 text-[11px] text-ink-muted">
          {created
            ? "Script includes your newly generated key."
            : "Generate a key first, or replace pk_live_YOUR_KEY before embedding."}{" "}
          Test page: <code>npm run dev:widget</code> → http://localhost:4173
        </p>
      </div>
    </div>
  );
}
