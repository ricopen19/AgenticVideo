import { Img, staticFile, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../config";
import { VisualContent, AnimationType } from "../data/script";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface SceneVisualsProps {
  scene: number;
  lineId: number | null;
  frame: number;
  fps: number;
  visual?: VisualContent;
}

// アニメーションスタイルを計算
const useAnimationStyle = (
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
      return {
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [50, 0])}px)`,
      };

    case "slideLeft":
      return {
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [100, 0])}px)`,
      };

    case "zoomIn":
      return {
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
      };

    case "bounce":
      return {
        opacity: Math.min(1, frame / (fps * 0.1)),
        transform: `scale(${springProgress})`,
      };

    default:
      return { opacity: progress };
  }
};

export const SceneVisuals: React.FC<SceneVisualsProps> = ({
  scene,
  lineId,
  frame,
  fps,
  visual,
}) => {
  const animationStyle = useAnimationStyle(frame, fps, visual?.animation);

  // コンテンツコンテナ（黒板内に収まるよう調整）
  const contentContainer: React.CSSProperties = {
    position: "absolute",
    top: 60,
    left: 80,
    right: 80,
    bottom: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...animationStyle,
  };

  // ビジュアルがない場合はデフォルト表示
  if (!visual || visual.type === "none") {
    return null;
  }

  // 画像表示
  if (visual.type === "image" && visual.src) {
    return (
      <div style={contentContainer}>
        <Img
          src={staticFile(`content/${visual.src}`)}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: 8,
          }}
        />
      </div>
    );
  }

  // テキスト表示
  if (visual.type === "text" && visual.text) {
    return (
      <div style={contentContainer}>
        <div
          style={{
            fontSize: visual.fontSize || 64,
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
      </div>
    );
  }

  // 数式ステップ表示
  if (visual.type === "math-step" && visual.formula) {
    const stepNum = visual.stepNum ?? 1;
    const stepStyles: Record<number, { bg: string; color: string }> = {
      1: { bg: "#f4a0a0", color: "#222" },
      2: { bg: "#f0e070", color: "#222" },
      3: { bg: "#9898e0", color: "#fff" },
      4: { bg: "#90d090", color: "#222" },
    };
    const { bg: stepBg, color: stepFg } = stepStyles[stepNum] ?? stepStyles[1];

    return (
      <div style={contentContainer}>
        <div
          style={{
            background: "#16162a",
            borderRadius: 16,
            padding: "40px 60px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            minWidth: 600,
            boxShadow: "0 4px 32px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: visual.stepColor ?? stepBg,
              color: stepFg,
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: "0.05em",
              padding: "6px 18px",
              borderRadius: 6,
              alignSelf: "flex-start",
            }}
          >
            STEP {stepNum}
          </div>
          <div
            style={{
              fontSize: 44,
              color: "#f0f0f0",
              textAlign: "center",
            }}
          >
            <Latex>{`$${visual.formula}$`}</Latex>
          </div>
          {visual.hint && (
            <div
              style={{
                fontSize: 22,
                color: "#5b8fff",
                textAlign: "center",
              }}
            >
              ← {visual.hint}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
