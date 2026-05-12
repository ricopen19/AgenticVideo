#!/usr/bin/env npx ts-node

/**
 * VOICEVOX音声一括生成スクリプト
 *
 * 使用方法:
 *   npx ts-node scripts/generate-voices.ts
 *
 * 前提条件:
 *   - VOICEVOXがlocalhost:50021で起動していること
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as yaml from "yaml";

const ROOT_DIR = process.cwd();

// 設定読み込み
const CONFIG_PATH = path.join(ROOT_DIR, "src/config.ts");
const SCRIPT_PATH = path.join(ROOT_DIR, "src/data/script.ts");
const OUTPUT_DIR = path.join(ROOT_DIR, "public/voices");

interface VoiceGenerationConfig {
  host: string;
  playbackRate: number;
  fps: number;
}

interface ScriptLine {
  id: number;
  character: string;
  text: string;
  voiceFile: string;
}

interface CharacterConfig {
  id: string;
  voicevoxSpeakerId: number;
}

// TTS前処理ルールの型
interface TTSRules {
  substitutions?: Record<string, string>;
}

// config/tts-rules.yaml を読み込む
function loadTTSRules(): TTSRules {
  const rulesPath = path.join(ROOT_DIR, "config", "tts-rules.yaml");
  if (!fs.existsSync(rulesPath)) return {};
  return yaml.parse(fs.readFileSync(rulesPath, "utf-8")) || {};
}

// $...$ 内の数式を読み上げ用テキストに変換
function convertMathToSpeech(inner: string): string {
  let s = inner;
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$2ぶんの$1");
  s = s.replace(/\\leq?\b/g, "以下");
  s = s.replace(/\\geq?\b/g, "以上");
  s = s.replace(/</g, "より小さい");
  s = s.replace(/>/g, "より大きい");
  s = s.replace(/=/g, "イコール");
  s = s.replace(/-(\w)/g, "マイナス$1");
  s = s.replace(/\\[a-zA-Z]+/g, "");
  s = s.replace(/[{}]/g, "");
  return s.trim();
}

// VOICEVOXに送る前にテキストを前処理する
function preprocessForTTS(text: string, rules: TTSRules): string {
  let s = text;
  // display math $$...$$ を除去
  s = s.replace(/\$\$[\s\S]*?\$\$/g, "");
  // inline math $...$ を読み上げ用テキストに変換
  s = s.replace(/\$([^$\n]+)\$/g, (_, inner) => convertMathToSpeech(inner));
  // 置換ルールを適用
  for (const [from, to] of Object.entries(rules.substitutions ?? {})) {
    s = s.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), to);
  }
  return s.replace(/\s{2,}/g, " ").trim();
}

// VOICEVOXが起動しているか確認
async function checkVoicevox(host: string): Promise<boolean> {
  try {
    const response = await fetch(`${host}/version`);
    if (response.ok) {
      const version = await response.text();
      console.log(`VOICEVOX version: ${version}`);
      return true;
    }
  } catch (e) {
    console.error("VOICEVOXに接続できません。VOICEVOXを起動してください。");
  }
  return false;
}

// 音声クエリを取得
async function getAudioQuery(
  host: string,
  text: string,
  speakerId: number
): Promise<any> {
  const encodedText = encodeURIComponent(text);
  const response = await fetch(
    `${host}/audio_query?speaker=${speakerId}&text=${encodedText}`,
    { method: "POST" }
  );
  if (!response.ok) {
    throw new Error(`audio_query failed: ${response.statusText}`);
  }
  return response.json();
}

// 音声を合成
async function synthesize(
  host: string,
  query: any,
  speakerId: number
): Promise<ArrayBuffer> {
  const response = await fetch(`${host}/synthesis?speaker=${speakerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!response.ok) {
    throw new Error(`synthesis failed: ${response.statusText}`);
  }
  return response.arrayBuffer();
}

// WAVファイルの長さを取得（秒）
function getWavDuration(filePath: string): number {
  try {
    const result = execSync(
      `python3 -c "import wave; w=wave.open('${filePath}','r'); print(w.getnframes()/w.getframerate())"`,
      { encoding: "utf-8" }
    );
    return parseFloat(result.trim());
  } catch (e) {
    console.error(`Failed to get duration for ${filePath}`);
    return 0;
  }
}

// メイン処理
async function main() {
  const host = "http://localhost:50021";
  const fps = 30;
  const playbackRate = 1.2;

  // VOICEVOX確認
  if (!(await checkVoicevox(host))) {
    process.exit(1);
  }

  // TTS前処理ルール読み込み
  const ttsRules = loadTTSRules();
  const subCount = Object.keys(ttsRules.substitutions ?? {}).length;
  console.log(`TTS前処理ルール: 置換 ${subCount} 件`);

  // 出力ディレクトリ作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // スクリプトデータを動的に読み込み
  // Note: 実際の実装ではesbuildなどでビルドしてから読み込む
  console.log("スクリプトデータを読み込んでいます...");

  // ここでは例としてハードコードされたデータを使用
  // 実際にはscript.tsをパースして使用
  const scriptData: ScriptLine[] = [];
  const characters: Map<string, number> = new Map([
    ["zundamon", 3],
    ["metan", 2],
  ]);

  // script.tsを読み込んでパース
  const scriptContent = fs.readFileSync(SCRIPT_PATH, "utf-8");
  const scriptDataMatch = scriptContent.match(
    /export const scriptData[^=]*=\s*\[([\s\S]*?)\];/
  );

  if (scriptDataMatch) {
    // 簡易パース（本番ではAST解析を使用）
    const dataStr = scriptDataMatch[1];
    const lineMatches = dataStr.matchAll(
      /\{\s*"?id"?:\s*(\d+),\s*"?character"?:\s*"([^"]+)",\s*"?text"?:\s*"([^"]+)"[\s\S]*?"?voiceFile"?:\s*"([^"]+)"/g
    );

    for (const match of lineMatches) {
      scriptData.push({
        id: parseInt(match[1]),
        character: match[2],
        text: match[3],
        voiceFile: match[4],
      });
    }
  }

  console.log(`${scriptData.length}件のセリフを処理します...`);

  const durationsArray: { id: number; file: string; duration: number; frames: number }[] = [];
  const durationsMap: Record<string, number> = {};

  for (const line of scriptData) {
    const speakerId = characters.get(line.character);
    if (speakerId === undefined) {
      console.error(`Unknown character: ${line.character}`);
      continue;
    }

    const outputPath = path.join(OUTPUT_DIR, line.voiceFile);

    // 既存ファイルがあればスキップ（オプション）
    // if (fs.existsSync(outputPath)) {
    //   console.log(`Skip: ${line.voiceFile} (already exists)`);
    //   continue;
    // }

    try {
      console.log(`Generating: ${line.voiceFile} - "${line.text.substring(0, 30)}..."`);

      // TTS前処理（LaTeX変換・置換ルール適用）
      const ttsText = preprocessForTTS(line.text, ttsRules);
      if (ttsText !== line.text) {
        console.log(`  前処理: "${line.text.substring(0, 30)}..." → "${ttsText.substring(0, 30)}..."`);
      }

      // 音声クエリ取得
      const query = await getAudioQuery(host, ttsText, speakerId);

      // 音声合成
      const audio = await synthesize(host, query, speakerId);

      // ファイル保存
      fs.writeFileSync(outputPath, Buffer.from(audio));

      // 長さを取得してフレーム数を計算
      // frames は音声ファイルの自然なフレーム数（playbackRate は掛けない）
      // getAdjustedFrames で /playbackRate することで正しい再生長になる
      const duration = getWavDuration(outputPath);
      const frames = Math.ceil(duration * fps);

      durationsArray.push({
        id: line.id,
        file: line.voiceFile,
        duration,
        frames,
      });
      durationsMap[line.voiceFile] = frames;

      console.log(`  -> ${duration.toFixed(2)}s, ${frames} frames`);

    } catch (e) {
      console.error(`Error generating ${line.voiceFile}:`, e);
    }
  }

  // 結果をJSONで保存（sync-script.tsが期待するオブジェクト形式）
  const resultPath = path.join(OUTPUT_DIR, "durations.json");
  fs.writeFileSync(resultPath, JSON.stringify(durationsMap, null, 2));
  console.log(`\nDuration data saved to: ${resultPath}`);

  // script.ts更新用のコードを出力
  console.log("\n=== script.ts更新用 ===");
  for (const d of durationsArray) {
    console.log(`ID ${d.id}: durationInFrames: ${d.frames}, // ${d.duration.toFixed(2)}s`);
  }
}

main().catch(console.error);
