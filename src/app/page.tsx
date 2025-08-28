import type { Metadata } from 'next'
import { Generator, type FormValues } from './components/Generator'

export const dynamic = 'force-dynamic'

type SearchParams = { [key: string]: string | string[] | undefined }
type Props = { searchParams?: SearchParams }

const getStr = (sp: SearchParams, key: string, fallback: string) => {
  const v = sp[key]
  return (Array.isArray(v) ? v[0] : v) ?? fallback
}

export function generateMetadata({ searchParams = {} }: Props): Metadata {
  const title = getStr(searchParams, 'title', 'MetaCraft — Gerador de SEO/OG/Schema')
  const description = getStr(
    searchParams,
    'description',
    'Gera <meta> OG/Twitter e JSON-LD com preview ao vivo e imagem OG dinâmica.'
  )
  const canonical = getStr(searchParams, 'canonical', 'http://localhost:3000/')
  const siteName = getStr(searchParams, 'siteName', 'MetaCraft')
  const type = getStr(searchParams, 'type', 'website') as 'website' | 'article'
  const twitterCard = getStr(
    searchParams,
    'twitterCard',
    'summary_large_image'
  ) as 'summary' | 'summary_large_image'

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const ogTitle = getStr(searchParams, 'ogImageText', title)
  const ogBg = getStr(searchParams, 'ogBg', '#0ea5e9')
  const ogFg = getStr(searchParams, 'ogFg', '#020617')
  const ogUrl = `${base}/api/og?${new URLSearchParams({ title: ogTitle, bg: ogBg, fg: ogFg })}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type,
      siteName,
      url: canonical,
      images: [{ url: ogUrl }],
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: [ogUrl],
    },
  }
}

export default function Page({ searchParams = {} }: Props) {
  const initialValues: Partial<FormValues> = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ''])
  )

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': (searchParams.jsonldType as string) ?? 'WebSite',
    name: getStr(searchParams, 'title', 'MetaCraft — Gerador de SEO/OG/Schema'),
    url: getStr(searchParams, 'canonical', 'http://localhost:3000/'),
    author: searchParams.author ? { '@type': 'Person', name: getStr(searchParams, 'author', 'Você') } : undefined,
  }

  return (
    <>
      <Generator initialValues={initialValues} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
    </>
  )
}
