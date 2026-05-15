import { useState } from 'react';
import type { ScriptLine, Metadata, TimelineSegment } from '../../types';
import { ScriptRow } from './ScriptRow';
import { ScriptEditor } from './ScriptEditor';
import { ImportModal } from './ImportModal';

const TRACK_WIDTH = 56;

const TRACK_COLORS: Record<string, string> = {
  text: '#f59e0b',
  'svg-file': '#38bdf8',
  svg: '#38bdf8',
  image: '#38bdf8',
  video: '#a78bfa',
};

function buildTimeline(script: ScriptLine[]): { map: Map<number, TimelineSegment[]>; maxTracks: number } {
  interface RawSpan { from: number; to: number; type: string; trackIdx: number }
  const spans: RawSpan[] = [];

  for (const line of script) {
    if (!line.visuals) continue;
    for (const v of line.visuals) {
      if (v.type === 'none') continue;
      const from = v.lineFrom ?? line.id;
      const to = v.lineTo ?? line.id;
      spans.push({ from, to, type: v.type, trackIdx: 0 });
    }
  }

  spans.sort((a, b) => a.from - b.from || a.to - b.to);

  const trackEnds: number[] = [];
  for (const span of spans) {
    let t = trackEnds.findIndex(end => end < span.from);
    if (t === -1) { t = trackEnds.length; trackEnds.push(span.to); }
    else trackEnds[t] = span.to;
    span.trackIdx = t;
  }

  const map = new Map<number, TimelineSegment[]>();
  for (const span of spans) {
    const color = TRACK_COLORS[span.type] ?? '#94a3b8';
    if (span.from === span.to) {
      if (!map.has(span.from)) map.set(span.from, []);
      map.get(span.from)!.push({ trackIdx: span.trackIdx, role: 'single', color, visualType: span.type });
    } else {
      for (let id = span.from; id <= span.to; id++) {
        const role: TimelineSegment['role'] =
          id === span.from ? 'start' : id === span.to ? 'end' : 'middle';
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push({ trackIdx: span.trackIdx, role, color, visualType: span.type });
      }
    }
  }

  return { map, maxTracks: trackEnds.length };
}

interface ScriptTableProps {
  script: ScriptLine[];
  metadata: Metadata;
  onUpdate: (id: number, data: Partial<ScriptLine>) => Promise<ScriptLine>;
  onCreate: (data: Omit<ScriptLine, 'id'>) => Promise<ScriptLine>;
  onDelete: (id: number) => Promise<void>;
  onMoveUp: (id: number) => Promise<void>;
  onMoveDown: (id: number) => Promise<void>;
  onInsertAt: (afterId: number, data: Omit<ScriptLine, 'id'>) => Promise<ScriptLine>;
  onBulkImport: (lines: Array<{ character: string; text: string }>, mode: 'replace' | 'append') => Promise<unknown>;
}

export function ScriptTable({
  script,
  metadata,
  onUpdate,
  onCreate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onInsertAt,
  onBulkImport,
}: ScriptTableProps) {
  const [editingLine, setEditingLine] = useState<ScriptLine | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [insertAfterId, setInsertAfterId] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);

  const handleEdit = (line: ScriptLine) => {
    setEditingLine(line);
    setIsCreating(false);
    setInsertAfterId(null);
  };

  const handleCreate = () => {
    const lastLine = script[script.length - 1];
    const newLine: ScriptLine = {
      id: 0,
      character: metadata.characters[0]?.id || 'zundamon',
      text: '',
      scene: lastLine?.scene || 1,
      voiceFile: '',
      durationInFrames: 60,
      pauseAfter: 15,
    };
    setEditingLine(newLine);
    setIsCreating(true);
    setInsertAfterId(null);
  };

  const handleInsertBelow = (line: ScriptLine) => {
    const newLine: ScriptLine = {
      id: 0,
      character: line.character,
      text: '',
      scene: line.scene,
      voiceFile: '',
      durationInFrames: 60,
      pauseAfter: line.pauseAfter,
    };
    setEditingLine(newLine);
    setIsCreating(true);
    setInsertAfterId(line.id);
  };

  const handleSave = async (data: Partial<ScriptLine>) => {
    if (!editingLine) return;

    try {
      if (isCreating) {
        if (insertAfterId !== null) {
          await onInsertAt(insertAfterId, data as Omit<ScriptLine, 'id'>);
        } else {
          await onCreate(data as Omit<ScriptLine, 'id'>);
        }
      } else {
        await onUpdate(editingLine.id, data);
      }
      setEditingLine(null);
      setIsCreating(false);
      setInsertAfterId(null);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this line?')) return;
    try {
      await onDelete(id);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleClose = () => {
    setEditingLine(null);
    setIsCreating(false);
    setInsertAfterId(null);
  };

  const handlePushVisualsDown = async (lineIndex: number) => {
    const currentLine = script[lineIndex];
    const nextLine = script[lineIndex + 1];
    if (!nextLine || !currentLine.visuals?.length) return;
    const pushed = currentLine.visuals.map(v => ({ ...v, animation: 'none' as const }));
    const existing = nextLine.visuals || [];
    // 既存のピンの前に挿入（重複除去）
    const merged = [
      ...pushed,
      ...existing.filter(ev => !pushed.some(pv => pv.text === ev.text && pv.src === ev.src)),
    ];
    await onUpdate(nextLine.id, { visuals: merged });
  };

  const { map: timelineMap, maxTracks } = buildTimeline(script);
  const timelineWidth = Math.max(1, maxTracks) * TRACK_WIDTH;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Script</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 text-sm border border-indigo-300 text-indigo-600 bg-white rounded-lg hover:bg-indigo-50 transition-colors"
          >
            一括インポート
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            + Add Line
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Char</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
              <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: timelineWidth, minWidth: 20 }}>TL</th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-14">Dur</th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-14">Pause</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {script.map((line, index) => (
              <ScriptRow
                key={line.id}
                line={line}
                index={index}
                totalLines={script.length}
                characters={metadata.characters}
                onEdit={() => handleEdit(line)}
                onDelete={() => handleDelete(line.id)}
                onMoveUp={() => onMoveUp(line.id)}
                onMoveDown={() => onMoveDown(line.id)}
                onInsertBelow={() => handleInsertBelow(line)}
                onQuickUpdate={(field, value) => onUpdate(line.id, { [field]: value })}
                onPushVisualsDown={
                  line.visuals?.length && index < script.length - 1
                    ? () => handlePushVisualsDown(index)
                    : undefined
                }
                timelineSegments={timelineMap.get(line.id)}
                timelineWidth={timelineWidth}
                metadata={metadata}
              />
            ))}
          </tbody>
        </table>

        {script.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No script lines yet. Click "Add Line" to create one.
          </div>
        )}
      </div>

      {editingLine && (
        <ScriptEditor
          line={editingLine}
          metadata={metadata}
          isNew={isCreating}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}

      {showImport && (
        <ImportModal
          metadata={metadata}
          onImport={onBulkImport as (lines: Array<{ character: string; text: string }>, mode: 'replace' | 'append') => Promise<void>}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
