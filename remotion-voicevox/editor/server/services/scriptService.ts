import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

const ROOT_DIR = path.resolve(process.cwd(), '..');
const SCRIPT_YAML_PATH = path.join(ROOT_DIR, 'config', 'script.yaml');
const DEFAULTS_YAML_PATH = path.join(ROOT_DIR, 'config', 'defaults.yaml');
const DURATIONS_PATH = path.join(ROOT_DIR, 'public', 'voices', 'durations.json');

export interface ScriptLine {
  id: number;
  character: string;
  text: string;
  displayText?: string;
  scene: number;
  voiceFile?: string;
  durationInFrames?: number;
  pauseAfter: number;
  emotion?: string;
  visuals?: Array<{
    type: "image" | "video" | "text" | "svg" | "svg-file" | "none";
    src?: string;
    startFrom?: number;
    text?: string;
    fontSize?: number;
    color?: string;
    animation?: string;
    lineFrom?: number;
    lineTo?: number;
  }>;
  se?: {
    src: string;
    volume?: number;
  };
}

interface Defaults {
  newLine: {
    character: string;
    pauseAfter: number;
    durationInFrames: number;
    scene: number;
  };
  automation: {
    voiceOnSave: boolean;
    autoVoiceFileName: boolean;
  };
}

function loadDefaults(): Defaults {
  const content = fs.readFileSync(DEFAULTS_YAML_PATH, 'utf-8');
  return yaml.parse(content);
}

function loadDurations(): Record<string, number> {
  if (fs.existsSync(DURATIONS_PATH)) {
    const content = fs.readFileSync(DURATIONS_PATH, 'utf-8');
    return JSON.parse(content);
  }
  return {};
}

function processLine(line: ScriptLine, defaults: Defaults, durations: Record<string, number>): ScriptLine {
  const voiceFile = `${String(line.id).padStart(2, '0')}_${line.character}.wav`;
  const durationInFrames = durations[voiceFile] || defaults.newLine.durationInFrames;

  return {
    ...line,
    voiceFile,
    durationInFrames,
    pauseAfter: line.pauseAfter ?? defaults.newLine.pauseAfter,
  };
}

export function getScript(): ScriptLine[] {
  const content = fs.readFileSync(SCRIPT_YAML_PATH, 'utf-8');
  const rawScript: ScriptLine[] = yaml.parse(content) || [];
  const defaults = loadDefaults();
  const durations = loadDurations();

  return rawScript.map(line => processLine(line, defaults, durations));
}

export function getScriptLine(id: number): ScriptLine | undefined {
  const script = getScript();
  return script.find(line => line.id === id);
}

export function updateScriptLine(id: number, data: Partial<ScriptLine>): ScriptLine {
  const content = fs.readFileSync(SCRIPT_YAML_PATH, 'utf-8');
  const script: ScriptLine[] = yaml.parse(content) || [];

  const index = script.findIndex(line => line.id === id);
  if (index === -1) {
    throw new Error(`Script line with id ${id} not found`);
  }

  // Update only allowed fields (don't store computed fields)
  const { voiceFile, durationInFrames, ...updateData } = data;
  const merged = { ...script[index] };
  for (const [key, val] of Object.entries(updateData)) {
    if (val === null) {
      delete (merged as Record<string, unknown>)[key];
    } else {
      (merged as Record<string, unknown>)[key] = val;
    }
  }
  merged.id = id;
  script[index] = merged as ScriptLine;

  // Write back to YAML
  const yamlContent = yaml.stringify(script, { lineWidth: 0 });
  fs.writeFileSync(SCRIPT_YAML_PATH, `# スクリプトデータ\n# 編集後 npm run sync-script で反映\n\n${yamlContent}`);

  // Return processed line
  const defaults = loadDefaults();
  const durations = loadDurations();
  return processLine(script[index], defaults, durations);
}

export function createScriptLine(data: Omit<ScriptLine, 'id'>): ScriptLine {
  const content = fs.readFileSync(SCRIPT_YAML_PATH, 'utf-8');
  const script: ScriptLine[] = yaml.parse(content) || [];
  const defaults = loadDefaults();

  // Generate new id
  const maxId = Math.max(0, ...script.map(line => line.id));
  const newLine: ScriptLine = {
    id: maxId + 1,
    character: data.character || defaults.newLine.character,
    text: data.text || '',
    scene: data.scene ?? defaults.newLine.scene,
    pauseAfter: data.pauseAfter ?? defaults.newLine.pauseAfter,
  };

  // Add optional fields if present
  if (data.displayText) newLine.displayText = data.displayText;
  if (data.emotion) newLine.emotion = data.emotion;
  if (data.visuals) newLine.visuals = data.visuals;
  if (data.se) newLine.se = data.se;

  script.push(newLine);

  // Write back to YAML
  const yamlContent = yaml.stringify(script, { lineWidth: 0 });
  fs.writeFileSync(SCRIPT_YAML_PATH, `# スクリプトデータ\n# 編集後 npm run sync-script で反映\n\n${yamlContent}`);

  // Return processed line
  const durations = loadDurations();
  return processLine(newLine, defaults, durations);
}

export function deleteScriptLine(id: number): void {
  const content = fs.readFileSync(SCRIPT_YAML_PATH, 'utf-8');
  const script: ScriptLine[] = yaml.parse(content) || [];

  const index = script.findIndex(line => line.id === id);
  if (index === -1) {
    throw new Error(`Script line with id ${id} not found`);
  }

  script.splice(index, 1);

  // Write back to YAML
  const yamlContent = yaml.stringify(script, { lineWidth: 0 });
  fs.writeFileSync(SCRIPT_YAML_PATH, `# スクリプトデータ\n# 編集後 npm run sync-script で反映\n\n${yamlContent}`);
}

export function bulkImportLines(
  lines: Array<{ character: string; text: string }>,
  mode: 'replace' | 'append'
): ScriptLine[] {
  const defaults = loadDefaults();
  const durations = loadDurations();

  let existingScript: ScriptLine[] = [];
  if (mode === 'append') {
    const content = fs.readFileSync(SCRIPT_YAML_PATH, 'utf-8');
    existingScript = yaml.parse(content) || [];
  }

  const startId = mode === 'replace' ? 1 : Math.max(0, ...existingScript.map(l => l.id)) + 1;
  const newLines: ScriptLine[] = lines.map((line, i) => ({
    id: startId + i,
    character: line.character,
    text: line.text,
    scene: defaults.newLine.scene,
    pauseAfter: defaults.newLine.pauseAfter,
  }));

  const finalScript = mode === 'replace' ? newLines : [...existingScript, ...newLines];
  const yamlContent = yaml.stringify(finalScript, { lineWidth: 0 });
  fs.writeFileSync(SCRIPT_YAML_PATH, `# スクリプトデータ\n# 編集後 npm run sync-script で反映\n\n${yamlContent}`);

  return finalScript.map(line => processLine(line, defaults, durations));
}

// SceneVisuals.tsx と同じ抽出ルール（サーバー側コピー）
function extractMathFromText(text: string): NonNullable<ScriptLine['visuals']>[number] | undefined {
  const displayMatches = [...text.matchAll(/\$\$([^$]+)\$\$/g)].map(m => `$$${m[1]}$$`);
  if (displayMatches.length > 0) {
    return { type: 'text', text: displayMatches.join('\n\n'), fontSize: 64, animation: 'fadeIn' };
  }
  const inlineMatches = [...text.matchAll(/\$([^$\n]+)\$/g)]
    .filter(([, inner]) => inner.length > 7 && (/\{/.test(inner) || /[+\-=]/.test(inner)))
    .map(([, inner]) => `$${inner}$`);
  if (inlineMatches.length === 0) return undefined;
  return { type: 'text', text: inlineMatches.join('\n\n'), fontSize: 64, animation: 'fadeIn' };
}

export function applyAutoVisuals(): { script: ScriptLine[]; applied: number } {
  const content = fs.readFileSync(SCRIPT_YAML_PATH, 'utf-8');
  const script: ScriptLine[] = yaml.parse(content) || [];
  const defaults = loadDefaults();
  const durations = loadDurations();

  let applied = 0;
  const updated = script.map(line => {
    // explicit visuals が設定済みの行はスキップ（上書きしない）
    if (line.visuals !== undefined) return line;
    const extracted = extractMathFromText(line.text);
    if (!extracted) return line;
    applied++;
    return { ...line, visuals: [extracted] };
  });

  if (applied > 0) {
    const yamlContent = yaml.stringify(updated, { lineWidth: 0 });
    fs.writeFileSync(SCRIPT_YAML_PATH, `# スクリプトデータ\n# 編集後 npm run sync-script で反映\n\n${yamlContent}`);
  }

  return {
    script: updated.map(line => processLine(line, defaults, durations)),
    applied,
  };
}

export function reorderScript(ids: number[]): ScriptLine[] {
  const content = fs.readFileSync(SCRIPT_YAML_PATH, 'utf-8');
  const script: ScriptLine[] = yaml.parse(content) || [];
  const defaults = loadDefaults();
  const durations = loadDurations();

  // Create a map of id to script line
  const scriptMap = new Map(script.map(line => [line.id, line]));

  // Reorder based on provided ids
  const reordered: ScriptLine[] = [];
  for (const id of ids) {
    const line = scriptMap.get(id);
    if (line) {
      reordered.push(line);
    }
  }

  // Add any remaining lines
  for (const line of script) {
    if (!ids.includes(line.id)) {
      reordered.push(line);
    }
  }

  // Write back to YAML
  const yamlContent = yaml.stringify(reordered, { lineWidth: 0 });
  fs.writeFileSync(SCRIPT_YAML_PATH, `# スクリプトデータ\n# 編集後 npm run sync-script で反映\n\n${yamlContent}`);

  return reordered.map(line => processLine(line, defaults, durations));
}
