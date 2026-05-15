import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Latex from 'react-latex-next';
import type { ScriptLine, CharacterInfo } from '../../types';

interface ScriptRowProps {
  line: ScriptLine;
  index: number;
  totalLines: number;
  characters: CharacterInfo[];
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onInsertBelow: () => void;
  onQuickUpdate: (field: keyof ScriptLine, value: unknown) => void;
  onPushVisualsDown?: () => void;
}

export function ScriptRow({ line, index, totalLines, characters, onEdit, onDelete, onMoveUp, onMoveDown, onInsertBelow, onQuickUpdate, onPushVisualsDown }: ScriptRowProps) {
  const [editingField, setEditingField] = useState<'pauseAfter' | 'text' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [pinPreview, setPinPreview] = useState<{ idx: number; x: number; y: number } | null>(null);
  const [hoveredPinIdx, setHoveredPinIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pinRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const character = characters.find((c) => c.id === line.character);
  const characterName = character?.name || line.character;

  const charColor = character?.color ?? '#6b7280';
  const badgeStyle: React.CSSProperties = {
    backgroundColor: `${charColor}22`,
    color: charColor,
    border: `1px solid ${charColor}55`,
  };

  const startEditing = (field: 'pauseAfter' | 'text', e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingField(field);
    setEditValue(String(line[field]));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingField !== 'text') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  const saveEdit = () => {
    if (editingField === 'pauseAfter') {
      const value = parseInt(editValue, 10);
      if (!isNaN(value) && value >= 0) {
        onQuickUpdate(editingField, value);
      }
    } else if (editingField === 'text') {
      if (editValue.trim()) {
        onQuickUpdate('text', editValue);
      }
    }
    setEditingField(null);
  };

  const playVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    const audio = new Audio(`/static/voices/${line.voiceFile}`);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      alert('音声ファイルが見つかりません');
    };
    audio.play();
    setIsPlaying(true);
  };

  const toggleCharacter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const voiceableIds = characters.filter(c => c.speakerId !== null).map(c => c.id);
    const currentIdx = voiceableIds.indexOf(line.character);
    const nextIdx = (currentIdx + 1) % voiceableIds.length;
    onQuickUpdate('character', voiceableIds[nextIdx]);
  };

  const removeVisual = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setPinPreview(null);
    setHoveredPinIdx(null);
    const newVisuals = (line.visuals || []).filter((_, i) => i !== idx);
    onQuickUpdate('visuals', newVisuals.length > 0 ? newVisuals : undefined);
  };

  const visuals = line.visuals || [];

  return (
    <tr className="group hover:bg-gray-50 cursor-pointer" onClick={onEdit}>
      <td className="px-2 py-2 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <button
            onClick={playVoice}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 ${isPlaying ? 'text-blue-600' : 'text-gray-400'}`}
            title="音声を再生"
          >
            {isPlaying ? '■' : '▶'}
          </button>
          <span className="w-6 text-right">{line.id}</span>
        </div>
      </td>
      <td className="px-2 py-2" onClick={toggleCharacter}>
        <span
          className="inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-75 transition-opacity"
          style={badgeStyle}
        >
          {characterName}
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-gray-900" onClick={(e) => startEditing('text', e)}>
        {editingField === 'text' ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => { if (e.key === 'Escape') setEditingField(null); }}
            className="w-full px-2 py-1 border border-blue-400 rounded text-sm resize-none"
            rows={2}
            autoFocus
          />
        ) : (
          <div className="flex items-start gap-1.5">
            <div className="flex-1 min-w-0">
              <div className="max-w-md truncate hover:bg-blue-50 px-1 rounded">
                {line.displayText || line.text}
              </div>
              {line.displayText && (
                <div className="text-xs text-gray-400 truncate max-w-md">
                  Voice: {line.text}
                </div>
              )}
            </div>
            {/* ピンバッジ（複数対応） */}
            {visuals.length > 0 && (
              <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {visuals.filter(v => v.type !== 'none').map((_v, i) => (
                  <span
                    key={i}
                    ref={el => { pinRefs.current[i] = el; }}
                    className="relative inline-flex items-center gap-0.5 text-xs px-1 py-0.5 bg-amber-100 text-amber-600 rounded cursor-default"
                    onMouseEnter={() => {
                      setHoveredPinIdx(i);
                      const rect = pinRefs.current[i]?.getBoundingClientRect();
                      if (rect) setPinPreview({ idx: i, x: rect.left, y: rect.bottom + 6 });
                    }}
                    onMouseLeave={() => {
                      setHoveredPinIdx(null);
                      setPinPreview(null);
                    }}
                  >
                    📌{visuals.length > 1 ? <sup>{i + 1}</sup> : null}
                    <button
                      onClick={(e) => removeVisual(e, i)}
                      style={{ opacity: hoveredPinIdx === i ? 1 : 0, transition: 'opacity 0.1s' }}
                      className="ml-0.5 text-amber-400 hover:text-red-500 leading-none text-xs"
                      title="ピンを削除"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* KaTeX ツールチップ */}
            {pinPreview !== null && visuals[pinPreview.idx]?.type === 'text' && visuals[pinPreview.idx]?.text && createPortal(
              <div
                style={{ position: 'fixed', left: pinPreview.x, top: pinPreview.y, zIndex: 9999 }}
                className="bg-gray-900 text-white rounded-lg px-4 py-3 shadow-2xl max-w-lg text-base pointer-events-none"
              >
                <Latex>{visuals[pinPreview.idx].text!}</Latex>
              </div>,
              document.body
            )}
          </div>
        )}
      </td>
      <td className="px-2 py-2 text-sm text-gray-400 text-right tabular-nums">
        {line.durationInFrames}
      </td>
      <td className="px-2 py-2 text-sm text-gray-500 text-right tabular-nums" onClick={(e) => startEditing('pauseAfter', e)}>
        {editingField === 'pauseAfter' ? (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className="w-14 px-1 py-0 text-right border border-blue-400 rounded text-sm"
            autoFocus
            min={0}
          />
        ) : (
          <span className="cursor-pointer hover:bg-blue-100 px-1 rounded">{line.pauseAfter}</span>
        )}
      </td>
      <td className="px-2 py-2 text-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-0.5">
          {/* 常時表示: Del */}
          <button
            onClick={onDelete}
            className="px-1.5 py-0.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="削除"
          >
            ✕
          </button>
          {/* ホバー時に表示: ↑ ↓ ＋ 📌↓ */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-20 disabled:cursor-not-allowed"
              title="上に移動"
            >
              ↑
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === totalLines - 1}
              className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-20 disabled:cursor-not-allowed"
              title="下に移動"
            >
              ↓
            </button>
            <button
              onClick={onInsertBelow}
              className="px-1.5 py-0.5 text-xs text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
              title="下に行を挿入"
            >
              ＋
            </button>
            {onPushVisualsDown && (
              <button
                onClick={(e) => { e.stopPropagation(); onPushVisualsDown(); }}
                className="px-1.5 py-0.5 text-xs text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded"
                title="ピンを下の行に追加コピー"
              >
                📌↓
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
