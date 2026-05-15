import { useState, useMemo } from 'react';
import type { Metadata } from '../../types';

interface ParsedLine {
  character: string;
  text: string;
}

interface ImportModalProps {
  metadata: Metadata;
  onImport: (lines: ParsedLine[], mode: 'replace' | 'append') => Promise<void>;
  onClose: () => void;
}

function parseLines(raw: string, voiceableChars: Metadata['characters']): ParsedLine[] {
  // Build name → character mapping including suffix matches
  // e.g., "めたん" matches "四国めたん", "ずんだ" matches "ずんだもん"
  const nameToChar = new Map<string, typeof voiceableChars[0]>();
  for (const char of voiceableChars) {
    nameToChar.set(char.name, char);
    nameToChar.set(char.id, char);
    // Register suffixes: "めたん" → "四国めたん"
    for (let i = 1; i < char.name.length; i++) {
      const suffix = char.name.slice(i);
      if (suffix.length >= 2 && !nameToChar.has(suffix)) {
        nameToChar.set(suffix, char);
      }
    }
    // Register prefixes: "ずんだ" → "ずんだもん"
    for (let i = 2; i < char.name.length; i++) {
      const prefix = char.name.slice(0, i);
      if (!nameToChar.has(prefix)) {
        nameToChar.set(prefix, char);
      }
    }
  }

  // Sort longest-first so longer names take precedence in the regex
  const allNames = Array.from(nameToChar.keys()).sort((a, b) => b.length - a.length);
  const escapedNames = allNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  // Split entire text on "キャラ名：" occurrences anywhere in the text (not just line start)
  const regex = new RegExp(`(${escapedNames.join('|')})[：:]`, 'g');
  const parts = raw.split(regex);
  // parts[0] = preamble before first character (discarded)
  // then alternating: parts[i] = charName, parts[i+1] = text

  const result: ParsedLine[] = [];
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const charName = parts[i];
    const text = (parts[i + 1] ?? '').trim()
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1');
    if (!text) continue;
    const char = nameToChar.get(charName);
    if (!char) continue;
    result.push({ character: char.id, text });
  }
  return result;
}

export function ImportModal({ metadata, onImport, onClose }: ImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const voiceableChars = useMemo(
    () => metadata.characters.filter(c => c.speakerId !== null),
    [metadata.characters]
  );

  const parsed = useMemo(() => parseLines(rawText, voiceableChars), [rawText, voiceableChars]);

  const handleImport = async (mode: 'replace' | 'append') => {
    if (parsed.length === 0) return;
    if (
      mode === 'replace' &&
      !confirm(`現在のスクリプト全行を削除して ${parsed.length} 行に置き換えます。よろしいですか？`)
    ) return;
    setIsImporting(true);
    try {
      await onImport(parsed, mode);
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const parseStatus =
    rawText.trim() === '' ? null :
    parsed.length > 0 ? `✓ ${parsed.length} 行を認識しました` :
    `認識できる行がありません（${voiceableChars.map(c => c.name).join('・')}のいずれかに続けて：テキスト の形式で入力してください）`;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[80vh] flex flex-col p-6 gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">一括インポート</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {voiceableChars.map(c => (
            <span
              key={c.id}
              className="px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${c.color}22`,
                color: c.color,
                border: `1px solid ${c.color}55`,
              }}
            >
              {c.name}
            </span>
          ))}
          <span className="text-gray-400 self-center">が対象</span>
        </div>

        <textarea
          className="border border-gray-300 rounded-lg p-3 text-sm font-mono resize-none h-52 focus:outline-none focus:border-indigo-400"
          placeholder={`${voiceableChars[1]?.name ?? 'めたん'}：今日は不等式を解いてみましょう。\n${voiceableChars[0]?.name ?? 'ずんだもん'}：なのだ！`}
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          autoFocus
        />

        <p className={`text-sm font-medium ${parsed.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
          {parseStatus ?? '—'}
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            disabled={parsed.length === 0 || isImporting}
            onClick={() => handleImport('append')}
            className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            追加
          </button>
          <button
            disabled={parsed.length === 0 || isImporting}
            onClick={() => handleImport('replace')}
            className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            置き換え
          </button>
        </div>
      </div>
    </div>
  );
}
