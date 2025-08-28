import type { Metadata } from 'next'
import { Generator, type FormValues } from './components/Generator'

export const dynamic = 'force-dynamic'

// searchParams no Next 15 é um Promise
type SP = { [key: string]: string | string[] | undefined }
type SPromise = Promise<SP>

const getStr = (sp: SP, key: string, fallback: string) => {
  const v = sp[key]
  return (Array.isArray(v) ? v[0] : v) ?? fallback
}

export async function generateMetadata(
  { searchParams }: { searchParams: SPromise }
): Promise<Metadata> {
  const sp = await searchParams

  const title = getStr(sp, 'title', 'MetaCraft — Gerador de SEO/OG/Schema')
  const description = getStr(
    sp,
    'description',
    'Gera <meta> OG/Twitter e JSON-LD com preview ao vivo e imagem OG dinâmica.'
  )
  const canonical = getStr(sp, 'canonical', 'http://localhost:3000/')
  const siteName = getStr(sp, 'siteName', 'MetaCraft')
  const type = getStr(sp, 'type', 'website') as 'website' | 'article'
  const twitterCard = getStr(sp, 'twitterCard', 'summary_large_image') as
    | 'summary'
    | 'summary_large_image'

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const ogTitle = getStr(sp, 'ogImageText', title)
  const ogBg = getStr(sp, 'ogBg', '#0ea5e9')
  const ogFg = getStr(sp, 'ogFg', '#020617')
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

export default async function Page({ searchParams }: { searchParams: SPromise }) {
  const sp = await searchParams

  const initialValues: Partial<FormValues> = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ''])
  )

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': (sp.jsonldType as string) ?? 'WebSite',
    name: getStr(sp, 'title', 'MetaCraft — Gerador de SEO/OG/Schema'),
    url: getStr(sp, 'canonical', 'http://localhost:3000/'),
    author: sp.author
      ? { '@type': 'Person', name: getStr(sp, 'author', 'Você') }
      : undefined,
  }

  return (
    <>
      <Generator initialValues={initialValues} />
      <script
        type="application/ld+json"
        // ok em Server Component:
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }}
      />
    </>
  )
}
