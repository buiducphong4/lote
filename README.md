# Lote Lottery Results Dashboard

Web app tra cứu kết quả xổ số bằng Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives và lucide-react.

## Run

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Scripts

```bash
npm run test
npm run build
```

## Data Sources

- Vietlott official pages:
  - `https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/535`
  - `https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/645`
  - `https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/655`
- Vietlott fallback history: `https://github.com/vietvudanh/vietlott-data`
  - `data/power535.jsonl`
  - `data/power645.jsonl`
  - `data/power655.jsonl`
- Mega Millions: NY Open Data Socrata dataset `5xaw-6ayf`.
- Mega Millions fallback: official Texas Lottery CSV winning numbers.
- EuroMillions: `https://euromillions.api.pedromealha.dev/v1/draws`, with fallback to `/draws`.
- EuroJackpot: `https://www.lottoland.com/api/drawings/euroJackpot/YYYYMMDD`.

## Architecture

All external data access is routed through Next.js backend code in `src/lib/lottery/adapters` and exposed via:

- `GET /api/lottery/games`
- `GET /api/lottery/latest?gameId=...`
- `GET /api/lottery/history?gameId=...&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&pageSize=30`

Each lottery provider has an adapter returning the normalized `LotteryDraw` schema in `src/lib/lottery/types.ts`.

## Cache Behavior

Server-side in-memory cache is implemented in `src/lib/lottery/cache.ts`.

- Latest results TTL: 10 minutes.
- Historical backfill TTL: 24 hours.

The cache is per server process. In serverless deployments it may be reset between cold starts.

## Limitations

- Vietlott does not expose an assumed public official JSON API here. The primary adapter parses the official HTML page. If the page structure changes, the UI shows: `Nguồn Vietlott thay đổi cấu trúc, cần cập nhật parser.`
- Mega Millions first tries the public Socrata endpoint. Some networks may receive a 403 without a Socrata app token. In that case the app falls back to the official Texas Lottery CSV, which includes winning numbers but not jackpot values.
- EuroMillions uses a community API, not an official lottery operator API.
- EuroJackpot uses the public Lottoland draw endpoint by draw date.
- Statistics are descriptive only. They are not predictions and should not be used as betting guidance.

## Disclaimer

Thông tin chỉ dùng để tham khảo, vui lòng đối chiếu với nguồn chính thức trước khi nhận thưởng. Không khuyến khích cờ bạc.
