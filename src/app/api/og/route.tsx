import { ImageResponse } from '@vercel/og'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'MetaCraft'
  const bg = searchParams.get('bg') ?? '#0ea5e9'
  const fg = searchParams.get('fg') ?? '#020617'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -1,
            color: fg,
            fontFamily: 'Inter, ui-sans-serif, system-ui',
          }}
        >
          {title}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}