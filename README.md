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
- Jackpot kỳ tới (mức nhà điều hành công bố): Lottoland (`next`) cho EuroMillions và EuroJackpot, trang Mega Millions của Texas Lottery cho Mega Millions. Vietlott chưa có nguồn công khai nên không hiển thị mục này.
- Tỷ giá: `https://open.er-api.com/v6/latest/USD` (chính), fallback `https://api.frankfurter.dev/v1/latest?base=USD` (ECB, không có VND), cuối cùng là bảng tỷ giá ngoại tuyến trong `src/lib/lottery/fx.ts`.

## Architecture

All external data access is routed through Next.js backend code in `src/lib/lottery/adapters` and exposed via:

- `GET /api/lottery/games`
- `GET /api/lottery/latest?gameId=...&currency=VND|USD|EUR`
- `GET /api/lottery/history?gameId=...&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&pageSize=30&currency=VND|USD|EUR`
- `GET /api/lottery/fx`

- `POST /api/lottery/refresh` — xoá cache của phần "kỳ mới nhất" để nút **Làm mới** thực sự gọi lại nguồn (có cooldown 20 giây, không đụng tới cache lịch sử).

Each lottery provider has an adapter returning the normalized `LotteryDraw` schema in `src/lib/lottery/types.ts`.
Adapter nào có nguồn công bố jackpot kỳ chưa quay thì cài thêm `getNext()`, trả về `NextDraw`.

## Jackpot kỳ này và jackpot kỳ tới

Đây là hai con số khác nhau và trước đây rất dễ nhầm:

- **Jackpot kỳ này** — giá trị của kỳ vừa quay. Không ai trúng thì đó là số tiền cộng dồn, lấy từ bảng cơ cấu giải thưởng của chính kỳ đó.
- **Jackpot kỳ tới** — mức nhà điều hành công bố cho kỳ chưa quay. Đây mới là con số các trang xổ số đưa lên trang chủ kèm đồng hồ đếm ngược, và là một ước tính.

Ví dụ EuroMillions ngày 23-10-2026: kỳ vừa quay cộng dồn €70,2M, còn mức công bố cho kỳ 27-10 là €79M.

## Money and Currency

Giải thưởng được lưu dưới dạng `Money = { amount: number; currency: "VND" | "USD" | "EUR" }` (`src/lib/lottery/money.ts`),
không phải chuỗi đã format sẵn. Adapter dùng `parseMoneyText` để đọc số tiền từ nguồn, còn việc hiển thị và quy đổi
diễn ra ở tầng UI.

- `currency` tùy chọn trên API sẽ quy đổi mọi giá trị tiền sang một đơn vị duy nhất trước khi trả về.
- Trên giao diện, thanh chọn tiền tệ ở header đổi đơn vị hiển thị ngay lập tức, không cần tải lại trang.
- Chế độ `Gốc` giữ nguyên tiền tệ của từng giải và hiển thị thêm dòng quy đổi sang VND cho các giải nước ngoài.
- Tỷ giá được cache 6 giờ.

## Cài đặt như một ứng dụng (PWA)

`src/app/manifest.ts` phục vụ `/manifest.webmanifest`, kèm icon PNG 192/512 và một bản `maskable`
trong `public/icons/`. Không có manifest thì Brave/Chrome/Edge không có "app identity" để cài, nên
mục **Install** không hiện ra. Icon được sinh từ `src/app/icon.svg` bằng `sharp`.

## Múi giờ kỳ quay

Nhà điều hành công bố kỳ quay theo ngày **ở nước họ**. EuroMillions quay 21:00 giờ Paris ngày 03/11
thì ở Việt Nam đã là 03:00 ngày 04/11, nên mục "Jackpot kỳ tới" dễ trông như bị lùi một ngày.

`NextDraw.drawAt` lưu đúng thời điểm đó dưới dạng UTC instant (`src/lib/lottery/drawTime.ts`,
có xử lý giờ mùa hè), còn giao diện hiển thị theo `Asia/Ho_Chi_Minh`. Ngày của **kỳ đã quay** vẫn
giữ nguyên theo nguồn, để đối chiếu với trang chính thức không bị lệch.

## Themes

Bốn bộ giao diện khác nhau về màu, phông chữ, bo góc, đổ bóng và hình dạng quả cầu số. Chọn bằng
biểu tượng bảng màu trên header; mỗi bộ đều có biến sáng và tối.

| Bộ | Phong cách | Phông hiển thị | Bo góc |
| --- | --- | --- | --- |
| `aurora` | Kính mờ, chuyển sắc, teal (mặc định) | Inter | mềm |
| `ban-tin` | Giấy in, phẳng hoàn toàn, mực đỏ | Playfair Display | gần vuông |
| `neon` | Nền tối, magenta/cyan, phát sáng | JetBrains Mono (in hoa) | rất tròn |
| `toi-gian` | Đơn sắc, không đổ bóng | Inter | vuông |

Mỗi bộ định nghĩa cùng một tập token trong `src/styles/globals.css`, chọn qua `[data-skin]` trên `<html>`.
Component không được hard-code bảng màu, bán kính bo góc hay phông chữ — Tailwind `borderRadius` và
`fontFamily` cũng trỏ vào các token này. Danh sách bộ giao diện nằm ở `src/lib/theme.ts`.

Một script nhỏ chạy trước khi trang vẽ lần đầu (`themeBootstrapScript`) để đọc lựa chọn đã lưu, tránh
nháy giao diện mặc định mỗi lần tải lại.

## User Preferences

Lưu trong `localStorage` và áp dụng ở client (`src/components/lottery/PreferencesProvider.tsx`):

- `lote:currency` — đơn vị tiền tệ hiển thị (`native` | `VND` | `USD` | `EUR`).
- `lote:gameOrder` — thứ tự các loại xổ số, chỉnh bằng kéo thả hoặc mũi tên ở mục "Sắp xếp & ẩn xổ số".
  Thứ tự này áp dụng cho cả lưới tổng quan lẫn thanh tab chọn game.
- `lote:hiddenGames` — các loại xổ số bị ẩn khỏi lưới tổng quan và thanh tab. Luôn phải còn ít nhất một
  loại hiển thị. Loại đang bị ẩn vẫn mở được bằng URL trực tiếp (`/games/<id>`) và khi đó vẫn xuất hiện
  trên thanh tab để biết mình đang xem gì.
- `lote:skin` — bộ giao diện đang dùng.
- `lote:theme` — chế độ sáng/tối; chưa đặt thì theo `prefers-color-scheme`.

## Cache Behavior

Server-side in-memory cache is implemented in `src/lib/lottery/cache.ts`.

- `TTL.latest` (60 giây) — memo hoá một lượt render "kỳ mới nhất".
- `TTL.upstream` (10 phút) — mức cũ tối đa mà một payload từ nguồn được phép có khi phục vụ "kỳ mới nhất". Nhiều nguồn trả 429 nếu poll dày hơn.
- `TTL.history` (24 giờ) — dữ liệu lịch sử.

Một payload có thể vừa phục vụ lịch sử vừa phục vụ kỳ mới nhất. Khi đó lượt đọc "kỳ mới nhất" truyền thêm
`maxAgeMs` vào `getCached` để không bị trả về bản đã nằm trong cache cả ngày — nếu thiếu bước này, một kỳ quay
mới có thể không xuất hiện suốt 24 giờ dù nguồn đã có dữ liệu.

The cache is per server process. In serverless deployments it may be reset between cold starts.

## Limitations

- Vietlott does not expose an assumed public official JSON API here. The primary adapter parses the official HTML page. If the page structure changes, the UI shows: `Nguồn Vietlott thay đổi cấu trúc, cần cập nhật parser.`
- Mega Millions first tries the public Socrata endpoint. Some networks may receive a 403 without a Socrata app token. In that case the app falls back to the official Texas Lottery CSV, which includes winning numbers but not jackpot values.
- EuroMillions uses a community API, not an official lottery operator API. Endpoint tải toàn bộ lịch sử nặng ~2MB và hay trả 429; khi đó adapter lùi về truy vấn theo năm và báo trong `Warnings`.
- Jackpot kỳ tới là ước tính do nhà điều hành công bố, không phải số quyết toán. Vietlott không có mục này.
- EuroJackpot uses the public Lottoland draw endpoint by draw date.
- Statistics are descriptive only. They are not predictions and should not be used as betting guidance.
- Số tiền quy đổi chỉ mang tính tham khảo: tỷ giá là tỷ giá thị trường, không phải tỷ giá mua/bán của ngân hàng.
- Tỷ lệ thực nhận sau thuế là ước tính theo `src/lib/lottery/tax.ts`, không phải con số quyết toán chính thức.
- Lịch sử Vietlott phải tải thêm trang chi tiết của từng kỳ để lấy jackpot nên lần tải đầu của mỗi trang có thể mất vài chục giây.

## Disclaimer

Thông tin chỉ dùng để tham khảo, vui lòng đối chiếu với nguồn chính thức trước khi nhận thưởng. Không khuyến khích cờ bạc.
