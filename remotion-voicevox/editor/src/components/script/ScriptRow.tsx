import { useState, useRef, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import Latex from 'react-latex-next';
import type { ScriptLine, CharacterInfo, TimelineSegment, VisualContent, Metadata, AnimationType } from '../../types';

const PIN_STYLES: Record<string, { badge: string; label: string; muted: string }> = {
  text:     { badge: 'bg-amber-100 text-amber-600', label: '',              muted: 'text-amber-400' },
  'svg-file': { badge: 'bg-sky-100 text-sky-700',   label: 'text-sky-500',  muted: 'text-sky-400' },
  image:    { badge: 'bg-sky-100 text-sky-700',     label: 'text-sky-500',  muted: 'text-sky-400' },
  video:    { badge: 'bg-violet-100 text-violet-700', label: 'text-violet-500', muted: 'text-violet-400' },
};

const PIN_TYPE_LABELS: Record<string, string | undefined> = {
  'svg-file': 'SVG',
  image: 'IMG',
  video: 'VID',
  text: 'TXT',
};

const TRACK_WIDTH = 56;
const TYPE_LABELS: Record<string, string> = {
  'svg-file': 'SVG', svg: 'SVG', image: 'IMG', video: 'VID', text: 'TXT',
};

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
  timelineSegments?: TimelineSegment[];
  timelineWidth: number;
  metadata: Metadata;
}

export function ScriptRow({ line, index, totalLines, characters, onEdit, onDelete, onMoveUp, onMoveDown, onInsertBelow, onQuickUpdate, onPushVisualsDown, timelineSegments, timelineWidth, metadata }: ScriptRowProps) {
  const [editingField, setEditingField] = useState<'pauseAfter' | 'text' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [pinPreview, setPinPreview] = useState<{ idx: number; x: number; y: number } | null>(null);
  const [hoveredPinIdx, setHoveredPinIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pinRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [editingPinIdx, setEditingPinIdx] = useState<number | null>(null);
  const [pinEdits, setPinEdits] = useState<VisualContent | null>(null);
  const [pinEditPos, setPinEditPos] = useState<{ x: number; y: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editingPinIdx === null) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setEditingPinIdx(null);
        setPinEdits(null);
        setPinEditPos(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [editingPinIdx]);

  const openPinEdit = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const rect = pinRefs.current[idx]?.getBoundingClientRect();
    if (!rect) return;
    const popoverWidth = 320;
    const x = Math.min(rect.left, window.innerWidth - popoverWidth - 16);
    setEditingPinIdx(idx);
    setPinEdits({ ...visuals[idx] });
    setPinEditPos({ x, y: rect.bottom + 8 });
    setPinPreview(null);
  };

  const applyPinEdit = () => {
    if (editingPinIdx === null || !pinEdits) return;
    const newVisuals = visuals.map((v, i) => i === editingPinIdx ? pinEdits : v);
    onQuickUpdate('visuals', newVisuals);
    setEditingPinIdx(null);
    setPinEdits(null);
    setPinEditPos(null);
  };

  const closePinEdit = () => {
    setEditingPinIdx(null);
    setPinEdits(null);
    setPinEditPos(null);
  };

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
    setEditingPinIdx(null);
    setPinEdits(null);
    setPinEditPos(null);
    const newVisuals = (line.visuals || []).filter((_, i) => i !== idx);
    onQuickUpdate('visuals', newVisuals.length > 0 ? newVisuals : undefined);
  };

  const visuals = line.visuals || [];

  return (
    <tr className="group hover:bg-gray-50 cursor-pointer" onClick={onEdit}>
      <td className="px-2 py-2 text-sm text-gray-500">
        <div className="flex items-center gap-0.5">
          {/* ↑↓ ホバー時に左端に表示 */}
          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              disabled={index === 0}
              className="w-4 h-3.5 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded text-xs leading-none disabled:opacity-20 disabled:cursor-not-allowed"
              title="上に移動"
            >
              ▴
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              disabled={index === totalLines - 1}
              className="w-4 h-3.5 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded text-xs leading-none disabled:opacity-20 disabled:cursor-not-allowed"
              title="下に移動"
            >
              ▾
            </button>
          </div>
          <button
            onClick={playVoice}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 ${isPlaying ? 'text-blue-600' : 'text-gray-400'}`}
            title="音声を再生"
          >
            {isPlaying ? '■' : '▶'}
          </button>
          <span className="w-5 text-right">{line.id}</span>
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
                {visuals.filter(v => v.type !== 'none').map((_v, i) => {
                  const pinStyle = PIN_STYLES[_v.type] ?? PIN_STYLES.text;
                  const typeLabel = PIN_TYPE_LABELS[_v.type];
                  return (
                    <span
                      key={i}
                      ref={el => { pinRefs.current[i] = el; }}
                      className={`relative inline-flex items-center gap-0.5 text-xs px-1 py-0.5 rounded cursor-pointer ${pinStyle.badge}`}
                      title="クリックで編集"
                      onClick={(e) => openPinEdit(e, i)}
                      onMouseEnter={() => {
                        setHoveredPinIdx(i);
                        if (editingPinIdx !== null) return;
                        const rect = pinRefs.current[i]?.getBoundingClientRect();
                        if (rect) setPinPreview({ idx: i, x: rect.left, y: rect.bottom + 6 });
                      }}
                      onMouseLeave={() => {
                        setHoveredPinIdx(null);
                        setPinPreview(null);
                      }}
                    >
                      📌
                      {typeLabel && <span className={`font-mono font-bold ${pinStyle.label}`}>{typeLabel}</span>}
                      {visuals.length > 1 ? <sup>{i + 1}</sup> : null}
                      {(_v.lineFrom != null || _v.lineTo != null) ? (
                        <span className={`ml-0.5 text-xs ${pinStyle.muted}`}>
                          {_v.lineFrom != null ? `${_v.lineFrom}` : `${line.id}`}→{_v.lineTo != null ? `${_v.lineTo}` : `${line.id}`}
                        </span>
                      ) : null}
                      <button
                        onClick={(e) => removeVisual(e, i)}
                        style={{ opacity: hoveredPinIdx === i ? 1 : 0, transition: 'opacity 0.1s' }}
                        className={`ml-0.5 hover:text-red-500 leading-none text-xs ${pinStyle.muted}`}
                        title="ピンを削除"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {/* ピン プレビュー（ホバー） */}
            {pinPreview !== null && (() => {
              const v = visuals[pinPreview.idx];
              if (!v) return null;
              if (v.type === 'text' && v.text) return createPortal(
                <div style={{ position: 'fixed', left: pinPreview.x, top: pinPreview.y, zIndex: 9999 }}
                  className="bg-gray-900 text-white rounded-lg px-4 py-3 shadow-2xl max-w-lg text-base pointer-events-none">
                  <Latex>{v.text}</Latex>
                </div>,
                document.body
              );
              if ((v.type === 'svg-file' || v.type === 'image') && v.src) return createPortal(
                <div style={{ position: 'fixed', left: pinPreview.x, top: pinPreview.y, zIndex: 9999, background: '#3a5f3a', borderRadius: 8, padding: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.6)' }}
                  className="pointer-events-none">
                  <img src={`/static/content/${v.src}`} width={420} style={{ display: 'block' }} />
                </div>,
                document.body
              );
              return null;
            })()}
          </div>
        )}
      </td>
      <td className="px-0 py-0 align-middle" style={{ width: timelineWidth, minWidth: timelineWidth }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'relative', height: 40, width: timelineWidth }}>
          {(timelineSegments ?? []).map((seg, i) => {
            const cx = seg.trackIdx * TRACK_WIDTH + TRACK_WIDTH / 2;
            const label = TYPE_LABELS[seg.visualType] ?? seg.visualType.slice(0, 3).toUpperCase();
            return (
              <Fragment key={i}>
                {/* top-half line (for middle and end) */}
                {(seg.role === 'middle' || seg.role === 'end') && (
                  <div style={{ position: 'absolute', left: cx - 1, top: 0, height: seg.role === 'end' ? 'calc(50% - 11px)' : '50%', width: 2, background: seg.color, opacity: 0.75 }} />
                )}
                {/* arrowhead pointing down (for end) */}
                {seg.role === 'end' && (
                  <div style={{ position: 'absolute', left: cx - 4, top: 'calc(50% - 11px)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `6px solid ${seg.color}`, opacity: 0.75 }} />
                )}
                {/* bottom-half line (for start and middle) */}
                {(seg.role === 'start' || seg.role === 'middle') && (
                  <div style={{ position: 'absolute', left: cx - 1, top: seg.role === 'start' ? 'calc(50% + 11px)' : '50%', height: seg.role === 'start' ? 'calc(50% - 11px)' : '50%', width: 2, background: seg.color, opacity: 0.75 }} />
                )}
                {/* start / single badge */}
                {(seg.role === 'start' || seg.role === 'single') && (
                  <div style={{ position: 'absolute', left: cx, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 2, border: `1.5px solid ${seg.color}`, borderRadius: 4, padding: '1px 5px', background: `${seg.color}22`, fontSize: 10, fontWeight: 700, color: seg.color, whiteSpace: 'nowrap', lineHeight: '1.4' }}>
                    <span style={{ fontSize: 9 }}>📌</span><span>{label}</span>
                  </div>
                )}
                {/* end badge (lighter, no pin icon) */}
                {seg.role === 'end' && (
                  <div style={{ position: 'absolute', left: cx, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, display: 'inline-flex', alignItems: 'center', border: `1.5px solid ${seg.color}`, borderRadius: 4, padding: '1px 5px', background: `${seg.color}11`, fontSize: 10, fontWeight: 600, color: seg.color, whiteSpace: 'nowrap', opacity: 0.65, lineHeight: '1.4' }}>
                    <span>{label}</span>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
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
          {/* ホバー時に表示: ＋ 📌↓ */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
      {editingPinIdx !== null && pinEdits !== null && pinEditPos !== null && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', left: pinEditPos.x, top: pinEditPos.y, zIndex: 9999 }}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 text-sm"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-amber-600 text-sm">📌 ピン {editingPinIdx + 1}</span>
            <button onClick={closePinEdit} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select
                value={pinEdits.type}
                onChange={e => setPinEdits({ ...pinEdits, type: e.target.value as VisualContent['type'] })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              >
                {metadata.visualTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Animation</label>
              <select
                value={pinEdits.animation || 'fadeIn'}
                onChange={e => setPinEdits({ ...pinEdits, animation: e.target.value as AnimationType })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              >
                {metadata.animations.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">開始行 ID</label>
              <input
                type="number"
                value={pinEdits.lineFrom ?? ''}
                onChange={e => setPinEdits({ ...pinEdits, lineFrom: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                placeholder={String(line.id)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">終了行 ID</label>
              <input
                type="number"
                value={pinEdits.lineTo ?? ''}
                onChange={e => setPinEdits({ ...pinEdits, lineTo: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                placeholder={String(line.id)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">表示順</label>
              <input
                type="number"
                value={pinEdits.order ?? ''}
                onChange={e => setPinEdits({ ...pinEdits, order: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                placeholder="0"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </div>
          </div>

          {(pinEdits.type === 'image' || pinEdits.type === 'svg-file' || pinEdits.type === 'video') && (
            <div className="mb-3 space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Source</label>
                <input
                  type="text"
                  value={pinEdits.src || ''}
                  onChange={e => setPinEdits({ ...pinEdits, src: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                />
              </div>
              {pinEdits.type === 'video' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start From (frames)</label>
                  <input
                    type="number"
                    value={pinEdits.startFrom ?? 0}
                    onChange={e => setPinEdits({ ...pinEdits, startFrom: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {pinEdits.type === 'text' && (
            <div className="mb-3 space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">数式テキスト</label>
                <textarea
                  value={pinEdits.text || ''}
                  onChange={e => setPinEdits({ ...pinEdits, text: e.target.value })}
                  rows={2}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                  <input
                    type="number"
                    value={pinEdits.fontSize || 64}
                    onChange={e => setPinEdits({ ...pinEdits, fontSize: parseInt(e.target.value, 10) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Color</label>
                  <input
                    type="color"
                    value={pinEdits.color || '#ffffff'}
                    onChange={e => setPinEdits({ ...pinEdits, color: e.target.value })}
                    className="w-full h-7 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <button
              onClick={(e) => { if (editingPinIdx !== null) removeVisual(e, editingPinIdx); }}
              className="text-xs text-red-400 hover:text-red-600"
            >
              削除
            </button>
            <div className="flex gap-2">
              <button onClick={closePinEdit} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700">
                キャンセル
              </button>
              <button onClick={applyPinEdit} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                適用
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </tr>
  );
}
