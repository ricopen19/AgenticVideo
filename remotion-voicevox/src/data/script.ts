import { CharacterId } from "../config";

// アニメーションの型定義
export type AnimationType = "none" | "fadeIn" | "slideUp" | "slideLeft" | "zoomIn" | "bounce";

// ビジュアルの型定義
export interface VisualContent {
  type: "image" | "video" | "text" | "math-step" | "svg" | "none";
  src?: string;
  startFrom?: number;   // video専用: 再生開始フレーム（省略時は0）
  text?: string;
  fontSize?: number;
  color?: string;
  animation?: AnimationType;
  // math-step専用
  stepNum?: number;
  stepColor?: string;
  formula?: string;
  hint?: string;
  // svg専用
  svg?: string;
}

// 効果音の型定義
export interface SoundEffect {
  src: string;
  volume?: number;
}

// BGM設定
export interface BGMConfig {
  src: string;
  volume?: number;
  loop?: boolean;
}

// BGM設定（動画全体で使用）
export const bgmConfig: BGMConfig | null = null;

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  scene: number;
  voiceFile: string;
  durationInFrames: number;
  pauseAfter: number;
  emotion?: "normal" | "happy" | "surprised" | "thinking" | "sad";
  visuals?: VisualContent[];
  se?: SoundEffect;
}

// シーン定義
export interface SceneInfo {
  id: number;
  title: string;
  background: string;
}

export const scenes: SceneInfo[] = [
  { id: 1, title: "オープニング", background: "gradient" },
  { id: 2, title: "メインコンテンツ", background: "solid" },
  { id: 3, title: "エンディング", background: "gradient" },
];

// このファイルは config/script.yaml から自動生成されます
// 編集する場合は config/script.yaml を編集して npm run sync-script を実行してください
export const scriptData: ScriptLine[] = [
  {
    "id": 1,
    "character": "metan",
    "text": "「今回は『不等式を満たす整数 $x$ がちょうど6個存在するような $a$ の値の範囲』を考えていくわよ。まずは準備として、大元の不等式①を解くところから始めましょうか。」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "01_metan.wav",
    "durationInFrames": 380
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "「よっしゃ！ まかせるのだ！」\n🗺️ 解法の全体像flowchart TD\n    A[\"①の解の確認<br>（範囲の数式化）\"] --> B[\"区間の『中心』を見つける\"]\n    B --> C[\"中心から近い順に<br>整数をカウント（表を作成）\"]\n    C --> D[\"ちょうど6個になる<br>『端の数』の条件を考える\"]\n    D --> E[\"不等式を立てて<br>aの範囲を解く\"]\n1️⃣ 不等式①を解く",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 151
  },
  {
    "id": 3,
    "character": "metan",
    "text": "「問題の不等式はこれね。$a$ は正の定数よ。」$$|2x - 3| \\leqq a$$",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$$|2x - 3| \\leqq a$$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "03_metan.wav",
    "durationInFrames": 111
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "「絶対値の不等式なのだ！ $|X| \\leqq a$ の形は、$-a \\leqq X \\leqq a$ になるって習ったのだ。だから、こうやって外すのだ！」$$-a \\leqq 2x - 3 \\leqq a$$",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$$-a \\leqq 2x - 3 \\leqq a$$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 350
  },
  {
    "id": 5,
    "character": "metan",
    "text": "「その通り！ じゃあ、真ん中を $x$ だけにするために、順番に変形していってちょうだい。」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "05_metan.wav",
    "durationInFrames": 200
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "「まずは全部の辺に $3$ を足すのだ！」$$3 - a \\leqq 2x \\leqq 3 + a$$",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$$3 - a \\leqq 2x \\leqq 3 + a$$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 84
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "「次に、全部を $2$ で割るのだ！ これで解が求まったのだ！」$$\\frac{3 - a}{2} \\leqq x \\leqq \\frac{3 + a}{2} \\quad \\cdots \\text{（解）}$$",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$$\\frac{3 - a}{2} \\leqq x \\leqq \\frac{3 + a}{2} \\quad \\cdots \\text{（解）}$$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 144
  },
  {
    "id": 8,
    "character": "metan",
    "text": "「完璧ね！ この $x$ の範囲の中に、整数が『ちょうど6個』入るような $a$ を探していくわよ。」\n2️⃣ 区間の「中心」を見つける",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "08_metan.wav",
    "durationInFrames": 334
  },
  {
    "id": 9,
    "character": "metan",
    "text": "「ここからが(3)の本番よ。さっき求めた範囲には文字 $a$ が入っていて、このままじゃ考えにくいわよね。こういう時は、この区間の『中心（真ん中）』がどこにあるかに注目するのがコツよ。ずんだもん、この区間の中心の座標はどうやって求めればいいかしら？」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "09_metan.wav",
    "durationInFrames": 609
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "「真ん中……？ 端と端を足して、$2$ で割ればいいのだ？」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 138
  },
  {
    "id": 11,
    "character": "metan",
    "text": "「その通り！ じゃあ、計算してみて。」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "11_metan.wav",
    "durationInFrames": 101
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "「やってみるのだ！ 左端の $\\frac{3 - a}{2}$ と右端の $\\frac{3 + a}{2}$ を足すと…… $a$ が消えて $\\frac{6}{2} = 3$ になるのだ。それをさらに $2$ で割るから、中心は $1.5$ なのだ！」$$\\text{中心} = \\frac{ \\frac{3 - a}{2} + \\frac{3 + a}{2} }{2} = \\frac{3}{2} = 1.5$$",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$$\\text{中心} = \\frac{ \\frac{3 - a}{2} + \\frac{3 + a}{2} }{2} = \\frac{3}{2} = 1.5$$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 525
  },
  {
    "id": 13,
    "character": "metan",
    "text": "「素晴らしいわ！ つまり、この不等式の範囲は『 $1.5$ を中心にして、左右に同じだけ広がっている』ということよ。」\n3️⃣ 中心から近い順に整数をカウントする",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "13_metan.wav",
    "durationInFrames": 383
  },
  {
    "id": 14,
    "character": "metan",
    "text": "「じゃあ、中心の $1.5$ から近い順番に、整数を拾ってみましょう。まずは一番近い整数は何と何かしら？」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "14_metan.wav",
    "durationInFrames": 263
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "「$1.5$ のすぐ隣だから……左が $1$ で、右が $2$ なのだ！」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 148
  },
  {
    "id": 16,
    "character": "metan",
    "text": "「そう！ その次は？」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "16_metan.wav",
    "durationInFrames": 56
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "「左が $0$ で、右が $3$ なのだ。どんどん広がっていくのだ！」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 146
  },
  {
    "id": 18,
    "character": "metan",
    "text": "「いいわね。それじゃあ、ここで情報を整理して数直線を書いてみましょう。整数が『ちょうど6個』になるには、どこまで範囲に入ればいいかしら？」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "18_metan.wav",
    "durationInFrames": 322
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "「数直線を見ると一目瞭然なのだ！ ちょうど6個になるためには、『 $-1$ から $4$ までの整数 』が入っていればいいのだ。そして、『 $-2$ と $5$ 』は入っちゃダメなのだ！」\n4️⃣ 端の数の条件を不等式にする",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 535
  },
  {
    "id": 20,
    "character": "metan",
    "text": "「その気づきが一番重要よ！ 今回は右側の端っこである $\\frac{3 + a}{2}$ に注目して考えてみましょう。この右端は、数直線上でどの数字とどの数字の間に来ればいいかしら？」",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$\\frac{3 + a}{2}$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "20_metan.wav",
    "durationInFrames": 430
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "「右側には $4$ は入れたくて、$5$ は入れたくないから……右端は $4$ と $5$ の間にある必要があるのだ！」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 231
  },
  {
    "id": 22,
    "character": "metan",
    "text": "「大正解！ じゃあ、それを不等式で表すわよ。等号（ $\\leqq$ ）の扱いに気をつけてね。端っこが含まれる（黒丸の）不等式だから、右端がピッタリ $4$ の時と、ピッタリ $5$ の時、それぞれ条件を満たすかしら？」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "22_metan.wav",
    "durationInFrames": 496
  },
  {
    "id": 23,
    "character": "zundamon",
    "text": "「ええっと……。もし右端がピッタリ $4$ だと、 $\\leqq$ の範囲だから $4$ もちゃんと含まれるのだ。これはOKなのだ！でも、ピッタリ $5$ になっちゃうと、$5$ も範囲に入っちゃって整数が7個（左の $-2$ も入るから合計8個）になっちゃうからダメなのだ。だから、$4$ の方にはイコールをつけて、$5$ の方にはつけないのだ！」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "23_zundamon.wav",
    "durationInFrames": 743
  },
  {
    "id": 24,
    "character": "metan",
    "text": "「完璧な考察ね。その通りよ。よって、立てるべき不等式はこうなるわ。」$$4 \\leqq \\frac{3 + a}{2} < 5$$",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$$4 \\leqq \\frac{3 + a}{2} < 5$$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "24_metan.wav",
    "durationInFrames": 174
  },
  {
    "id": 25,
    "character": "zundamon",
    "text": "「あとはこの不等式を解くだけなのだ！ 全部を $2$ 倍して……」$$8 \\leqq 3 + a < 10$$",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$$8 \\leqq 3 + a < 10$$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "25_zundamon.wav",
    "durationInFrames": 134
  },
  {
    "id": 26,
    "character": "zundamon",
    "text": "「真ん中を $a$ だけにするために、全部から $3$ を引くのだ！」$$5 \\leqq a < 7 \\quad \\cdots \\text{（答え）}$$",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$$5 \\leqq a < 7 \\quad \\cdots \\text{（答え）}$$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "26_zundamon.wav",
    "durationInFrames": 136
  },
  {
    "id": 27,
    "character": "metan",
    "text": "「お見事！ これが求める $a$ の値の範囲よ。（ちなみに左端の $\\frac{3-a}{2}$ が $-2 < \\frac{3-a}{2} \\leqq -1$ になる条件で解いても、全く同じ答えになるわよ）区間の中心を求めて、そこから整数がどう配置されているか可視化すると、複雑な条件もスッキリ解けるわね。」",
    "scene": 1,
    "pauseAfter": 6,
    "visuals": [
      {
        "type": "text",
        "text": "$\\frac{3-a}{2}$\n\n$-2 < \\frac{3-a}{2} \\leqq -1$",
        "fontSize": 64,
        "animation": "fadeIn"
      }
    ],
    "voiceFile": "27_metan.wav",
    "durationInFrames": 698
  },
  {
    "id": 28,
    "character": "zundamon",
    "text": "「『中心から広げていくイメージ』を持てば、文字が入っていても全然怖くないのだ！ 今日も一つ賢くなったのだ！」",
    "scene": 1,
    "pauseAfter": 6,
    "voiceFile": "28_zundamon.wav",
    "durationInFrames": 273
  }
];

// VOICEVOXスクリプト生成用
export const generateVoicevoxScript = (
  data: ScriptLine[],
  characterSpeakerMap: Record<CharacterId, number>
) => {
  return data.map((line) => ({
    id: line.id,
    character: line.character,
    speakerId: characterSpeakerMap[line.character],
    text: line.text,
    outputFile: line.voiceFile,
  }));
};
