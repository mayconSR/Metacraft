"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  title: z.string().min(1, "Obrigatório"),
  description: z.string().min(1, "Obrigatório"),
  siteName: z.string().min(1, "Obrigatório"),
  canonical: z.string().url("URL inválida"),
  type: z.enum(["website", "article"]).default("website"),
  twitterCard: z
    .enum(["summary_large_image", "summary"])
    .default("summary_large_image"),
  author: z.string().optional(),
  ogImageText: z.string().default("MetaCraft"),
  ogBg: z.string().default("#0ea5e9"),
  ogFg: z.string().default("#020617"),
  jsonldType: z.enum(["WebSite", "Article", "Person"]).default("WebSite"),
});

export type FormValues = z.infer<typeof schema>;

export function Generator({
  initialValues,
}: {
  initialValues: Partial<FormValues>;
}) {
  const {
    register,
    formState: { errors },
    watch,
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "MetaCraft — Gerador de SEO/OG/Schema",
      description:
        "Gera <meta> OG/Twitter e JSON‑LD com preview ao vivo e imagem OG dinâmica.",
      siteName: "MetaCraft",
      canonical: "http://localhost:3000/",
      type: "website",
      twitterCard: "summary_large_image",
      author: "Você",
      ogImageText: "MetaCraft",
      ogBg: "#0ea5e9",
      ogFg: "#020617",
      jsonldType: "WebSite",
      ...initialValues,
    },
    mode: "onChange",
  });

  const values = watch();

  // compartilhar estado via URL (debounce leve)
  useEffect(() => {
    const id = setTimeout(() => {
      const sp = new URLSearchParams();
      Object.entries(getValues()).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.set(k, String(v));
      });
      const url = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState(null, "", url);
    }, 150);
    return () => clearTimeout(id);
  }, [values, getValues]);

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://localhost:3000";
    return window.location.origin;
  }, []);

  const ogURL = useMemo(() => {
    const t = values.ogImageText || values.title;
    const bg = values.ogBg || "#0ea5e9";
    const fg = values.ogFg || "#020617";
    const qs = new URLSearchParams({ title: t ?? "MetaCraft", bg, fg });
    return `${baseUrl}/api/og?${qs.toString()}`;
  }, [values.ogImageText, values.ogBg, values.ogFg, values.title, baseUrl]);

  const metaSnippet = useMemo(() => {
    const lines = [
      `<title>${values.title}</title>`,
      `<meta name="description" content="${values.description}" />`,
      `<link rel="canonical" href="${values.canonical}" />`,
      `<!-- Open Graph -->`,
      `<meta property="og:type" content="${values.type}" />`,
      `<meta property="og:site_name" content="${values.siteName}" />`,
      `<meta property="og:title" content="${values.title}" />`,
      `<meta property="og:description" content="${values.description}" />`,
      `<meta property="og:image" content="${ogURL}" />`,
      `<!-- Twitter -->`,
      `<meta name="twitter:card" content="${values.twitterCard}" />`,
      `<meta name="twitter:title" content="${values.title}" />`,
      `<meta name="twitter:description" content="${values.description}" />`,
      `<meta name="twitter:image" content="${ogURL}" />`,
    ];
    return lines.join("\n");
  }, [values, ogURL]);

  return (
    <div className="space-y-8">
      {/* Form */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm">Título</span>
            <input
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register("title")}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Site Name</span>
            <input
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register("siteName")}
            />
          </label>
          <label className="sm:col-span-2 space-y-1">
            <span className="text-sm">Descrição</span>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register("description")}
            />
          </label>
          <label className="sm:col-span-2 space-y-1">
            <span className="text-sm">Canonical</span>
            <input
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register("canonical")}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm">Tipo</span>
            <select
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register("type")}
            >
              <option value="website">website</option>
              <option value="article">article</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm">Twitter Card</span>
            <select
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register("twitterCard")}
            >
              <option value="summary_large_image">summary_large_image</option>
              <option value="summary">summary</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm">Autor (opcional)</span>
            <input
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register("author")}
            />
          </label>
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-sm">OG Texto</span>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
                {...register("ogImageText")}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm">OG BG</span>
              <input
                type="color"
                className="h-10 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-1 py-1"
                {...register("ogBg")}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm">OG FG</span>
              <input
                type="color"
                className="h-10 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-1 py-1"
                {...register("ogFg")}
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-sm">JSON‑LD @type</span>
            <select
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register("jsonldType")}
            >
              <option value="WebSite">WebSite</option>
              <option value="Article">Article</option>
              <option value="Person">Person</option>
            </select>
          </label>
        </div>
      </section>

      {/* Preview */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="p-3 text-sm opacity-70 border-b border-black/5 dark:border-white/5">
            Prévia da imagem OG
          </div>
          <div className="aspect-[1200/630] bg-black/5 dark:bg-white/5 grid place-items-center">
            <img src={ogURL} alt="Prévia OG" className="max-h-full" />
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="p-3 text-sm opacity-70 border-b border-black/5 dark:border-white/5">
            Snippet de &lt;head&gt;
          </div>
          <textarea
            readOnly
            rows={12}
            value={metaSnippet}
            className="w-full bg-transparent p-4 font-mono text-xs"
          />
        </div>
      </section>
    </div>
  );
}
