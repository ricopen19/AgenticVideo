import { Img, Video, staticFile, interpolate, spring } from "remotion";
import { COLORS } from "../config";
import { VisualContent, AnimationType } from "../data/script";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface SceneVisualsProps {
  scene: number;
  lineId: number | null;
  frame: number;
  fps: number;
  visuals?: VisualContent[];
  lineText?: string;
}

// text フィールドから数式を抽出して自動ビジュアルを生成
const extractMathFromText = (text: string): VisualContent | undefined => {
  // display math $$...$$ を優先 — 存在すればインライン数式は無視
  const displayMatches = [...text.matchAll(/\$\$([^$]+)\$\$/g)].map((m) => `$$${m[1]}$$`);
  if (displayMatches.length > 0) {
    return { type: "text", text: displayMatches.join("\n\n"), fontSize: 64, animation: "fadeIn" };
  }
  // inline math: 複雑な式のみ（{ を含む分数・式、または + - = を含む計算式）
  // 単体のコマンド（$\leqq$ など length≤7）は除外
  const inlineMatches = [...text.matchAll(/\$([^$\n]+)\$/g)]
    .filter(({ 1: inner }) => inner.length > 7 && (/\{/.test(inner) || /[+\-=]/.test(inner)))
    .map(({ 1: inner }) => `$${inner}$`);
  if (inlineMatches.length === 0) return undefined;
  return { type: "text", text: inlineMatches.join("\n\n"), fontSize: 64, animation: "fadeIn" };
};

// アニメーションスタイルを計算（純粋関数 — React hook ではない）
const getAnimationStyle = (
  frame: number,
  fps: number,
  animation: AnimationType = "fadeIn"
): React.CSSProperties => {
  const progress = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const springProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  switch (animation) {
    case "none":
      return { opacity: 1 };
    case "fadeIn":
      return { opacity: progress };
    case "slideUp":
      return { opacity: progress, transform: `translateY(${interpolate(progress, [0, 1], [50, 0])}px)` };
    case "slideLeft":
      return { opacity: progress, transform: `translateX(${interpolate(progress, [0, 1], [100, 0])}px)` };
    case "zoomIn":
      return { opacity: progress, transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})` };
    case "bounce":
      return { opacity: Math.min(1, frame / (fps * 0.1)), transform: `scale(${springProgress})` };
    default:
      return { opacity: progress };
  }
};

// 単一ビジュアルの描画（アニメーション付き）
const VisualItem: React.FC<{ visual: VisualContent; frame: number; fps: number; scaledFontSize: (base: number) => number }> = ({ visual, frame, fps, scaledFontSize }) => {
  const animStyle = getAnimationStyle(frame, fps, visual.animation);

  if (visual.type === "text" && visual.text) {
    return (
      <div
        style={{
          ...animStyle,
          fontSize: scaledFontSize(visual.fontSize || 64),
          fontWeight: "bold",
          color: visual.color || COLORS.text,
          textAlign: "center",
          lineHeight: 1.4,
          whiteSpace: "pre-wrap",
          textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
        }}
      >
        <Latex>{visual.text}</Latex>
      </div>
    );
  }

  if (visual.type === "svg" && (visual as any).svg) {
    const svgHtml = (visual as any).svg.replace(/max-width:[^;'"]+;?\s*/g, "");
    return (
      <div style={{ ...animStyle, width: "82%" }} dangerouslySetInnerHTML={{ __html: svgHtml }} />
    );
  }

  if (visual.type === "video" && visual.src) {
    return (
      <div style={animStyle}>
        <Video
          src={staticFile(`content/${visual.src}`)}
          startFrom={visual.startFrom ?? 0}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
        />
      </div>
    );
  }

  if (visual.type === "image" && visual.src) {
    return (
      <div style={animStyle}>
        <Img
          src={staticFile(`content/${visual.src}`)}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
        />
      </div>
    );
  }

  if (visual.type === "math-step" && (visual as any).formula) {
    const v = visual as any;
    const stepNum = v.stepNum ?? 1;
    const stepStyles: Record<number, { bg: string; color: string }> = {
      1: { bg: "#f4a0a0", color: "#222" },
      2: { bg: "#f0e070", color: "#222" },
      3: { bg: "#9898e0", color: "#fff" },
      4: { bg: "#90d090", color: "#222" },
    };
    const { bg: stepBg, color: stepFg } = stepStyles[stepNum] ?? stepStyles[1];
    return (
      <div style={animStyle}>
        <div style={{ background: "#16162a", borderRadius: 16, padding: "40px 60px", display: "flex", flexDirection: "column", gap: 20, minWidth: 600, boxShadow: "0 4px 32px rgba(0,0,0,0.6)" }}>
          <div style={{ display: "inline-block", background: v.stepColor ?? stepBg, color: stepFg, fontWeight: 900, fontSize: 22, letterSpacing: "0.05em", padding: "6px 18px", borderRadius: 6, alignSelf: "flex-start" }}>
            STEP {stepNum}
          </div>
          <div style={{ fontSize: 44, color: "#f0f0f0", textAlign: "center" }}>
            <Latex>{`$${v.formula}$`}</Latex>
          </div>
          {v.hint && <div style={{ fontSize: 22, color: "#5b8fff", textAlign: "center" }}>← {v.hint}</div>}
        </div>
      </div>
    );
  }

  return null;
};

export const SceneVisuals: React.FC<SceneVisualsProps> = ({
  scene,
  lineId,
  frame,
  fps,
  visuals,
  lineText,
}) => {
  // explicit visuals のみ使用（auto-extract は行わない）
  const effectiveVisuals: VisualContent[] = visuals
    ? visuals.filter((v) => v.type !== "none")
    : [];

  if (effectiveVisuals.length === 0) return null;

  // ピン数に応じて fontSize・gap を縮小（はみ出し防止）
  const n = effectiveVisuals.length;
  const scaledFontSize = (base: number) =>
    n >= 4 ? Math.min(base, 36) : n === 3 ? Math.min(base, 46) : n === 2 ? Math.min(base, 54) : base;
  const gap = n >= 4 ? 12 : n === 3 ? 18 : n === 2 ? 28 : 0;

  // コンテンツコンテナ（黒板内に収まるよう調整）
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    top: 60,
    left: 80,
    right: 80,
    bottom: 180,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap,
    overflow: "hidden",
  };

  return (
    <div style={containerStyle}>
      {effectiveVisuals.map((visual, i) => (
        <VisualItem key={i} visual={visual} frame={frame} fps={fps} scaledFontSize={scaledFontSize} />
      ))}
    </div>
  );
};
