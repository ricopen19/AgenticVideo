# Math Video Design

## Canvas
- 1920 × 1080, 16:9

## Palette

| Role | Hex | Notes |
|---|---|---|
| Background | `#0d0d18` | Dark blue-black, 黒板的 |
| Surface | `#16162a` | Cards, panels |
| Text Primary | `#f0f0f0` | Main text, math |
| Text Secondary | `#aaaacc` | Case labels, conditions |
| STEP 1 label bg | `#f4a0a0` | Soft pink (dark text) |
| STEP 2 label bg | `#f0e070` | Soft yellow (dark text) |
| STEP 3 label bg | `#9898e0` | Soft lavender (white text) |
| STEP 4 label bg | `#90d090` | Soft green (dark text) |
| Hint / annotation | `#5b8fff` | Royal blue, ←矢印テキスト |
| Divider | `rgba(255,255,255,0.10)` | Subtle separator |

## Typography
- Japanese: Noto Sans JP (supports Japanese)
- Math: KaTeX rendered HTML (CDN)
- Problem / headline: 52–64px, weight 700
- Step math: 32–36px
- Hint annotations: 20–22px, color `#5b8fff`
- Condition text: 28–32px, color `#aaaacc`

## Step Label Style
Pill badge, bold, `letter-spacing: 0.05em`.
STEP 3 uses `color: #fff` (lavender bg fails contrast with dark text).

```css
.step-label { display: inline-block; padding: 6px 18px; border-radius: 6px; font-weight: 900; }
.step1 { background: #f4a0a0; color: #222; }
.step2 { background: #f0e070; color: #222; }
.step3 { background: #9898e0; color: #fff; }
.step4 { background: #90d090; color: #222; }
```

## Motion
- Entrance: `x: -60 → 0, opacity: 0 → 1`, duration `0.5s`, ease `power3.out`
- Step stagger: `0.15s` between STEP badge and math line
- Hint fade-in: `0.25s` after step math, `power2.out`
- No exit animations (scene transition handles exit)
- Transition: crossfade `0.6s`

## Pacing per animSpeed setting
| Setting | Step hold duration |
|---|---|
| slow | 3.5s |
| normal | 2.5s |
| fast | 1.8s |

## Background Layer
- Subtle radial glow at center, `rgba(152, 152, 224, 0.06)`, very slow breathing scale
- Ghost large "∣x∣" text at 3% opacity, slow drift

## Don'ts
- No gradient text (`background-clip: text`)
- No cyan/neon/purple-to-blue gradients
- No pure `#000` or `#fff` — always tint toward palette
- No fonts other than Noto Sans JP for Japanese text
