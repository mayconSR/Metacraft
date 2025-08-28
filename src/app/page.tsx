import type { Metadata, ResolvingMetadata } from 'next'
import { Generator, type FormValues } from './components/Generator'

export const dynamic = 'force-dynamic' // garante atualização com searchParams

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(
  { searchParams }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const sp = await searchParams
  const get = (k: string, fallback: string) => (sp[k] as string) ?? fallback

  const title = get('title', 'MetaCraft — Gerador de SEO/OG/Schema')
  const description = get('description', 'Gera <meta> OG/Twitter e JSON‑LD com preview ao vivo e imagem OG dinâmica.')
  const canonical = get('canonical', 'http://localhost:3000/')
  const siteName = get('siteName', 'MetaCraft')
  const type = (sp.type as string) ?? 'website'
  const twitterCard = (sp.twitterCard as string) ?? 'summary_large_image'

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const ogTitle = get('ogImageText', title)
  const ogBg = get('ogBg', '#0ea5e9')
  const ogFg = get('ogFg', '#020617')
  const ogUrl = `${base}/api/og?${new URLSearchParams({ title: ogTitle, bg: ogBg, fg: ogFg }).toString()}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: type as any,
      siteName,
      url: canonical,
      images: [{ url: ogUrl }],
    },
    twitter: {
      card: twitterCard as any,
      title,
      description,
      images: [ogUrl],
    },
  }
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams
  const initialValues: Partial<FormValues> = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  )

  // JSON-LD simples com base nos params
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': (sp.jsonldType as string) ?? 'WebSite',
    name: (sp.title as string) ?? 'MetaCraft — Gerador de SEO/OG/Schema',
    url: (sp.canonical as string) ?? 'http://localhost:3000/',
    author: sp.author ? { '@type': 'Person', name: sp.author } : undefined,
  }

  return (
    <>
      <Generator initialValues={initialValues} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }}
      />
    </>
  )
}