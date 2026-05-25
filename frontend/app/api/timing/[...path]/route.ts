const LIVE_TIMING_BASE_URL = 'https://livetiming.formula1.com';

const ALLOWED_PAGES = new Set([
  'DriverList.jsonStream',
  'LapCount.jsonStream',
  'RaceControlMessages.jsonStream',
  'SessionInfo.jsonStream',
  'SessionStatus.jsonStream',
  'TimingAppData.jsonStream',
  'TimingData.jsonStream',
  'TrackStatus.jsonStream',
  'WeatherData.jsonStream',
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const page = path.at(-1);

  if (
    path.length < 2 ||
    path[0] !== 'static' ||
    !page ||
    !ALLOWED_PAGES.has(page) ||
    path.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    return Response.json({ detail: 'Unsupported timing data path' }, { status: 404 });
  }

  const upstreamPath = path.map(encodeURIComponent).join('/');
  const upstream = await fetch(`${LIVE_TIMING_BASE_URL}/${upstreamPath}`, {
    headers: {
      'User-Agent': 'BestHTTP',
      'Accept-Encoding': 'gzip, identity',
    },
    next: { revalidate: 43200 },
  });

  if (!upstream.ok) {
    return Response.json(
      { detail: 'Timing data source request failed' },
      { status: upstream.status }
    );
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
    },
  });
}
