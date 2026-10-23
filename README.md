# Seoul, Made for You

Your Korean Saju (사주) element + MBTI, turned into a Seoul trip plan made just for you.

Enter your birth date, your MBTI (or take a 4-question quiz), and how many days you have. You get your Saju element and animal sign, plus a 1–3 day itinerary through the Seoul neighborhoods that match your energy, with Naver / Kakao / Google Maps links for every stop.

## How it works

| Input | What it decides |
|---|---|
| Birth year, last digit | Your Saju element (Wood 木, Fire 火, Earth 土, Metal 金, Water 水) → your Day 1 neighborhood |
| Birth year | Your animal sign (띠) |
| Number of days | Days 2–3 follow the 상생 (generating) cycle: Wood → Fire → Earth → Metal → Water |
| MBTI **E / I** | Night stop: crowds and nightlife, or quiet spots |
| MBTI **S / N** | Must-see classics, or hidden gems |
| MBTI **J / P** | Timed plan (09:00, 10:30…), or loose slots (Morning, Afternoon…) |

The MBTI T / F letter is asked in the quiz but does not change the plan yet.

| Element | Neighborhoods |
|---|---|
| Wood 木 | Bukchon · Insadong · Ikseon-dong |
| Fire 火 | Yeonnam-dong · Hongdae · Mangwon |
| Earth 土 | Gyeongbokgung · Seochon · Jongno |
| Metal 金 | DDP · Seongsu · COEX |
| Water 水 | Han River · Yeouido · Banpo |

Each day also ends with a K-beauty tip, and the result can be shared (Web Share API, or copied to the clipboard on desktop).

## Run it

It is one static file: [index.html](index.html). No build step, no dependencies, no API keys.

- Open `index.html` in a browser, or
- Serve the folder locally, e.g. `npx serve .` or `python -m http.server`

## Deploy

Deploy the folder as a static site on Vercel (`npx vercel`, or import the repo in the Vercel dashboard; no framework preset needed).

## Edit the content

All content lives in the `<script>` block of `index.html`:

- `EL`: the five elements: description, neighborhoods, stops, colors and beauty tip. A stop can be a plain string, `{S, N}` (classic vs hidden) or `{E, I}` (lively vs quiet).
- `KO`: Korean search terms for each place, so Naver and Kakao Maps find the right spot. Add an entry whenever you add a new stop.
- `ANIMALS`, `DIGIT`, `CYCLE`: the animal signs, year digit → element, and the day order.

## Limitations

- For fun, not real fortune telling. The element uses only the birth year (the heavenly stem), not the full four pillars.
- The animal sign uses the calendar year, so Jan–Feb birthdays before the lunar new year may get the previous year's sign.
- Opening hours and seasonal events (e.g. the Banpo fountain) change. Check before you go.
