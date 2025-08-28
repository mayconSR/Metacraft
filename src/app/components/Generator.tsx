'use client'

import { useEffect, useMemo, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

/** ---------- Schema ---------- */
const hexMsg = 'Use um hex válido (#RRGGBB ou #RGB)'
const HEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

const schema = z.object({
  title: z.string().min(1, 'Obrigatório'),
  description: z.string().min(1, 'Obrigatório'),
  siteName: z.string().min(1, 'Obrigatório'),
  canonical: z.string().url('URL inválida'),
  type: z.enum(['website', 'article']).default('website'),
  twitterCard: z.enum(['summary_large_image', 'summary']).default('summary_large_image'),
  author: z.string().optional(),
  ogImageText: z.string().default('MetaCraft'),
  ogBg: z.string().regex(HEX, hexMsg).default('#0ea5e9'),
  ogFg: z.string().regex(HEX, hexMsg).default('#020617'),
  jsonldType: z.enum(['WebSite', 'Article', 'Person']).default('WebSite'),
})

export type FormValues = z.infer<typeof schema>

/** ---------- Utils ---------- */
const isHex = (s: string) => HEX.test(s)

function expandHex(h: string) {
  // #abc -> #aabbcc ; #aabbcc -> #aabbcc
  if (h.length === 4) {
    const a = h[1], b = h[2], c = h[3]
    return `#${a}${a}${b}${b}${c}${c}`
  }
  return h
}

function ratioWCAG(bg: string, fg: string) {
  // cálculo simples de contraste relativo
  try {
    const [br, bgc, bb] = [1, 3, 5].map(i => parseInt(expandHex(bg).slice(i, i + 2), 16) / 255)
    const [fr, fgx, fb] = [1, 3, 5].map(i => parseInt(expandHex(fg).slice(i, i + 2), 16) / 255)
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
    const L = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
    const Lb = L(br, bgc, bb), Lf = L(fr, fgx, fb)
    const [max, min] = Lb > Lf ? [Lb, Lf] : [Lf, Lb]
    return (max + 0.05) / (min + 0.05)
  } catch {
    return 0
  }
}

/** ---------- Component ---------- */
export function Generator({ initialValues }: { initialValues: Partial<FormValues> }) {
  const id = useId()
  const [imgLoading, setImgLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    register,
    formState: { errors },
    watch,
    getValues,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: 'MetaCraft — Gerador de SEO/OG/Schema',
      description: 'Gera <meta> OG/Twitter e JSON-LD com preview ao vivo e imagem OG dinâmica.',
      siteName: 'MetaCraft',
      canonical: 'http://localhost:3000/',
      type: 'website',
      twitterCard: 'summary_large_image',
      author: 'Você',
      ogImageText: 'MetaCraft',
      ogBg: '#0ea5e9',
      ogFg: '#020617',
      jsonldType: 'WebSite',
      ...initialValues,
    },
    mode: 'onChange',
  })

  const values = watch()

  // Estado -> URL (debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams()
      Object.entries(getValues()).forEach(([k, v]) => {
        if (v !== undefined && v !== '') sp.set(k, String(v))
      })
      const url = `${window.location.pathname}?${sp.toString()}`
      window.history.replaceState(null, '', url)
    }, 200)
    return () => clearTimeout(t)
  }, [values, getValues])

  const baseUrl = useMemo(
    () => (typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin),
    []
  )

  const ogURL = useMemo(() => {
    const t = values.ogImageText || values.title
    const bg = values.ogBg || '#0ea5e9'
    const fg = values.ogFg || '#020617'
    const qs = new URLSearchParams({ title: t ?? 'MetaCraft', bg, fg })
    return `${baseUrl}/api/og?${qs.toString()}`
  }, [values.ogImageText, values.ogBg, values.ogFg, values.title, baseUrl])

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
    ]
    return lines.join('\n')
  }, [values, ogURL])

  const contrast = useMemo(() => ratioWCAG(values.ogBg, values.ogFg), [values.ogBg, values.ogFg])
  const contrastMsg =
    contrast >= 4.5
      ? 'Bom contraste (≥ 4.5:1)'
      : contrast >= 3
      ? 'Contraste ok para texto grande (≥ 3:1)'
      : 'Contraste baixo — ajuste as cores'

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(metaSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-8">
      {/* Formulário */}
      <section aria-labelledby={`${id}-form-title`} className="space-y-6">
        <header className="space-y-1">
          <h2 id={`${id}-form-title`} className="text-xl font-semibold">Configuração</h2>
          <p id={`${id}-form-help`} className="text-sm opacity-80">
            Preencha os campos. Tudo reflete no preview e no snippet abaixo.
          </p>
        </header>

        <form aria-describedby={`${id}-form-help`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Título */}
          <div>
            <label htmlFor={`${id}-title`} className="text-sm">Título *</label>
            <input
              id={`${id}-title`}
              aria-invalid={!!errors.title}
              aria-errormessage={errors.title ? `${id}-title-err` : undefined}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              {...register('title')}
            />
            {errors.title && <p id={`${id}-title-err`} className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          {/* Site Name */}
          <div>
            <label htmlFor={`${id}-site`} className="text-sm">Site Name *</label>
            <input
              id={`${id}-site`}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register('siteName')}
            />
          </div>

          {/* Descrição */}
          <div className="sm:col-span-2">
            <label htmlFor={`${id}-desc`} className="text-sm">Descrição *</label>
            <textarea
              id={`${id}-desc`}
              rows={3}
              aria-invalid={!!errors.description}
              aria-errormessage={errors.description ? `${id}-desc-err` : undefined}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register('description')}
            />
            {errors.description && <p id={`${id}-desc-err`} className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          {/* Canonical */}
          <div className="sm:col-span-2">
            <label htmlFor={`${id}-canon`} className="text-sm">Canonical *</label>
            <input
              id={`${id}-canon`}
              aria-invalid={!!errors.canonical}
              aria-errormessage={errors.canonical ? `${id}-canon-err` : undefined}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register('canonical')}
            />
            {errors.canonical && <p id={`${id}-canon-err`} className="text-xs text-red-500 mt-1">{errors.canonical.message}</p>}
            <p className="text-xs opacity-70 mt-1">Ex.: https://seudominio.com/minha-pagina</p>
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor={`${id}-type`} className="text-sm">Tipo</label>
            <select
              id={`${id}-type`}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register('type')}
            >
              <option value="website">website</option>
              <option value="article">article</option>
            </select>
          </div>

          {/* Twitter Card */}
          <div>
            <label htmlFor={`${id}-tw`} className="text-sm">Twitter Card</label>
            <select
              id={`${id}-tw`}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register('twitterCard')}
            >
              <option value="summary_large_image">summary_large_image</option>
              <option value="summary">summary</option>
            </select>
          </div>

          {/* Autor */}
          <div>
            <label htmlFor={`${id}-author`} className="text-sm">Autor (opcional)</label>
            <input
              id={`${id}-author`}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
              {...register('author')}
            />
          </div>

          {/* OG Controls */}
          <fieldset className="sm:col-span-2 border border-black/10 dark:border-white/10 rounded-2xl p-4">
            <legend className="px-1 text-sm opacity-80">Imagem OG</legend>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor={`${id}-ogtext`} className="text-sm">Texto</label>
                <input
                  id={`${id}-ogtext`}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2"
                  {...register('ogImageText')}
                />
              </div>

              <div>
                <label htmlFor={`${id}-ogbg`} className="text-sm">Cor de fundo</label>
                <div className="flex gap-2 items-center">
                  <input
                    id={`${id}-ogbg`}
                    type="color"
                    className="h-10 w-14 rounded-md border border-black/10 dark:border-white/10"
                    value={isHex(values.ogBg) ? values.ogBg : '#0ea5e9'}
                    onChange={(e) => setValue('ogBg', e.target.value, { shouldDirty: true, shouldTouch: true })}
                    aria-label="Cor de fundo"
                  />
                  <input
                    aria-label="Hex da cor de fundo"
                    className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2 font-mono"
                    {...register('ogBg')}
                    placeholder="#0ea5e9"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${id}-ogfg`} className="text-sm">Cor do texto</label>
                <div className="flex gap-2 items-center">
                  <input
                    id={`${id}-ogfg`}
                    type="color"
                    className="h-10 w-14 rounded-md border border-black/10 dark:border-white/10"
                    value={isHex(values.ogFg) ? values.ogFg : '#020617'}
                    onChange={(e) => setValue('ogFg', e.target.value, { shouldDirty: true, shouldTouch: true })}
                    aria-label="Cor do texto"
                  />
                  <input
                    aria-label="Hex da cor do texto"
                    className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-3 py-2 font-mono"
                    {...register('ogFg')}
                    placeholder="#020617"
                  />
                </div>
                <p className="text-xs opacity-70 mt-1">{contrastMsg} — razão {contrast.toFixed(2)}:1</p>
              </div>
            </div>
          </fieldset>
        </form>
      </section>

      {/* Prévia & Snippet */}
      <section aria-labelledby={`${id}-preview-title`} className="space-y-6">
        <h2 id={`${id}-preview-title`} className="text-xl font-semibold">Prévia &amp; Snippet</h2>

        {/* Live region para anunciar mudanças no preview */}
        <div role="status" aria-live="polite" className="sr-only">Prévia atualizada</div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="p-3 text-sm opacity-80 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <span>Prévia da imagem OG</span>
            <a className="text-xs underline opacity-80 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md px-1" href={ogURL} target="_blank" rel="noreferrer">Abrir em nova aba</a>
          </div>
          <div className="aspect-[1200/630] bg-black/5 dark:bg-white/5 grid place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={ogURL}
              src={ogURL}
              alt={`Prévia da imagem OG com o título "${values.ogImageText || values.title}"`}
              className="max-h-full"
              onLoad={() => setImgLoading(false)}
              onError={() => setImgLoading(false)}
              onLoadStart={() => setImgLoading(true)}
            />
          </div>
          {imgLoading && <div className="p-3 text-xs opacity-70">Carregando prévia…</div>}
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="p-3 text-sm opacity-80 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <span>Snippet de &lt;head&gt;</span>
            <button
              type="button"
              onClick={copySnippet}
              className="text-xs underline opacity-80 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md px-1"
              aria-live="polite"
              aria-label="Copiar snippet para a área de transferência"
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <textarea readOnly rows={12} value={metaSnippet} className="w-full bg-transparent p-4 font-mono text-xs outline-none" />
        </div>

        <details className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden shadow-sm">
          <summary className="p-3 text-sm cursor-pointer">O que é cada coisa? (ajuda rápida)</summary>
          <div className="p-4 text-sm space-y-2 opacity-90">
            <p><strong>OG/Twitter</strong>: cartões bonitos no WhatsApp/LinkedIn/X. Ajuda a aumentar cliques.</p>
            <p><strong>Imagem OG</strong>: gerada na hora com título e cores. Padrão visual sem Photoshop.</p>
            <p><strong>JSON-LD</strong>: dados estruturados para Google entender melhor (SEO).</p>
            <p><strong>URL canônica</strong>: versão oficial do link (evita duplicidade).</p>
            <p><strong>Twitter Card</strong>: escolha do tamanho do cartão no X/Twitter.</p>
          </div>
        </details>
      </section>
    </div>
  )
}
