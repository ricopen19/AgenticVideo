#!/usr/bin/env npx ts-node
/**
 * セリフごとの開始フレームを計算し、Remotion Studio連携のHTMLビューアを生成する
 * 使用方法: npm run preview-map
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

const ROOT_DIR = process.cwd();

interface ScriptLine {
  id: number;
  character: string;
  text: string;
  displayText?: string;
  pauseAfter?: number;
  visual?: { type: string };
}

interface FrameEntry {
  id: number;
  character: string;
  text: string;
  startFrame: number;
  durationFrames: number;
  timeSec: number;
  visualType: string;
}

const CHAR_COLOR: Record<string, string> = {
  metan: "#FF1493",
  zundamon: "#228B22",
};

const CHAR_LABEL: Record<string, string> = {
  metan: "めたん",
  zundamon: "ずんだもん",
};

function main() {
  const scriptLines: ScriptLine[] = yaml.parse(
    fs.readFileSync(path.join(ROOT_DIR, "config/script.yaml"), "utf-8")
  );
  const durations: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, "public/voices/durations.json"), "utf-8")
  );
  const defaults = yaml.parse(
    fs.readFileSync(path.join(ROOT_DIR, "config/defaults.yaml"), "utf-8")
  );
  const settings = yaml.parse(
    fs.readFileSync(path.join(ROOT_DIR, "video-settings.yaml"), "utf-8")
  );

  const playbackRate: number = settings.video.playbackRate;
  const fps: number = settings.video.fps;
  const defaultPause: number = defaults.newLine.pauseAfter;
  const defaultDuration: number = defaults.newLine.durationInFrames;

  const entries: FrameEntry[] = [];
  let accFrame = 0;

  for (const line of scriptLines) {
    const voiceFile = `${String(line.id).padStart(2, "0")}_${line.character}.wav`;
    const rawDuration = durations[voiceFile] ?? defaultDuration;
    const pauseAfter = line.pauseAfter ?? defaultPause;

    const adjDuration = Math.ceil(rawDuration / playbackRate);
    const adjPause = Math.ceil(pauseAfter / playbackRate);

    entries.push({
      id: line.id,
      character: line.character,
      text: line.displayText ?? line.text,
      startFrame: accFrame,
      durationFrames: adjDuration,
      timeSec: accFrame / fps,
      visualType: line.visual?.type ?? "none",
    });

    accFrame += adjDuration + adjPause;
  }

  const totalFrames = accFrame;
  const totalSec = totalFrames / fps;

  // コンソール出力
  console.log(`\nFrame Map (playbackRate=${playbackRate}, fps=${fps})\n`);
  console.log("ID  | キャラ       | 開始    | 秒     | visual     | セリフ");
  console.log("----+-------------+---------+--------+------------+---------------------------");
  for (const e of entries) {
    const label = (CHAR_LABEL[e.character] ?? e.character).padEnd(7);
    const frame = String(e.startFrame).padStart(6);
    const sec = e.timeSec.toFixed(1).padStart(6);
    const vis = e.visualType.padEnd(10);
    const text = e.text.replace(/\n/g, " ").substring(0, 26);
    console.log(`${String(e.id).padStart(3)} | ${label}     | ${frame} | ${sec}s | ${vis} | ${text}`);
  }
  console.log(`\n合計: ${totalFrames} frames (${totalSec.toFixed(1)}s)`);

  // HTML生成
  const outPath = path.join(ROOT_DIR, "out/preview-map.html");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, generateHTML(entries, totalFrames, fps));
  console.log(`\n✅ out/preview-map.html を生成しました`);
}

function generateHTML(entries: FrameEntry[], totalFrames: number, fps: number): string {
  const studioBase = "http://localhost:3001";
  const totalSec = (totalFrames / fps).toFixed(1);

  const rows = entries.map((e) => {
    const color = CHAR_COLOR[e.character] ?? "#888";
    const label = CHAR_LABEL[e.character] ?? e.character;
    const timeSec = e.timeSec.toFixed(1);
    const text = e.text.replace(/\n/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const url = `${studioBase}/?frame=${e.startFrame}`;
    const visualBadge =
      e.visualType !== "none"
        ? `<span class="vis-badge vis-${e.visualType}">${e.visualType}</span>`
        : "";
    return `
      <tr class="row" onclick="openStudio(${e.startFrame})" title="Studio で frame ${e.startFrame} を開く">
        <td class="id">${e.id}</td>
        <td><span class="char-badge" style="background:${color}">${label}</span></td>
        <td class="frame">${e.startFrame}</td>
        <td class="time">${timeSec}s</td>
        <td>${visualBadge}</td>
        <td class="text">${text}</td>
        <td><a class="studio-link" href="${url}" target="studio" onclick="event.stopPropagation()">Studio →</a></td>
      </tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>Preview Map</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d0d18; color: #f0f0f0; font-family: 'Noto Sans JP', sans-serif; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 6px; color: #aaaacc; }
  .meta { font-size: 13px; color: #666; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 8px 12px; background: #16162a; color: #aaaacc;
       font-weight: 600; font-size: 12px; letter-spacing: .06em; border-bottom: 1px solid #2a2a44; }
  .row { cursor: pointer; border-bottom: 1px solid #1a1a2e; transition: background .1s; }
  .row:hover { background: #1e1e38; }
  td { padding: 10px 12px; vertical-align: middle; }
  .id { color: #555; font-size: 12px; width: 36px; }
  .char-badge { display: inline-block; padding: 3px 10px; border-radius: 999px;
                font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; }
  .frame { font-variant-numeric: tabular-nums; color: #9898e0; width: 70px; }
  .time  { font-variant-numeric: tabular-nums; color: #aaaacc; width: 60px; }
  .text  { color: #ddd; max-width: 480px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vis-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
  .vis-text       { background: #3a3a5c; color: #aaaacc; }
  .vis-image      { background: #2a4a2a; color: #90d090; }
  .vis-math-step  { background: #4a3a1a; color: #f0e070; }
  .studio-link { color: #5b8fff; text-decoration: none; font-size: 12px; white-space: nowrap; }
  .studio-link:hover { text-decoration: underline; }
  .hint { margin-top: 16px; font-size: 12px; color: #555; }
</style>
</head>
<body>
<h1>Preview Map</h1>
<p class="meta">合計 ${totalFrames} frames (${totalSec}s) &nbsp;·&nbsp; 行をクリックで Remotion Studio に移動</p>
<table>
  <thead>
    <tr>
      <th>#</th><th>キャラ</th><th>frame</th><th>時刻</th><th>visual</th><th>セリフ</th><th></th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
<p class="hint">※ Studio が起動していない場合は npm start を先に実行してください</p>
<script>
function openStudio(frame) {
  window.open('http://localhost:3001/?frame=' + frame, 'studio');
}
</script>
</body>
</html>`;
}

main();
