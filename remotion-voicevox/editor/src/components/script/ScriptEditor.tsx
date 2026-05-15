import { useState, useEffect } from 'react';
import type { ScriptLine, Metadata, VisualContent } from '../../types';

interface ScriptEditorProps {
  line: ScriptLine;
  metadata: Metadata;
  isNew: boolean;
  onSave: (data: Partial<ScriptLine>) => Promise<void>;
  onClose: () => void;
}

const emptyVisual = (): VisualContent => ({ type: 'text', text: '', animation: 'fadeIn', fontSize: 64 });

export function ScriptEditor({ line, metadata, isNew, onSave, onClose }: ScriptEditorProps) {
  const [formData, setFormData] = useState<ScriptLine>(line);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(line);
  }, [line]);

  const handleChange = (field: keyof ScriptLine, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSeChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      se: { ...prev.se, src: prev.se?.src || '', [field]: value },
    }));
  };

  // visuals[] 操作
  const updateVisual = (idx: number, field: keyof VisualContent, value: unknown) => {
    setFormData((prev) => {
      const visuals = [...(prev.visuals || [])];
      visuals[idx] = { ...visuals[idx], [field]: value };
      return { ...prev, visuals };
    });
  };

  const addVisual = () => {
    setFormData((prev) => ({
      ...prev,
      visuals: [...(prev.visuals || []), emptyVisual()],
    }));
  };

  const removeVisual = (idx: number) => {
    setFormData((prev) => {
      const visuals = (prev.visuals || []).filter((_, i) => i !== idx);
      return { ...prev, visuals: visuals.length > 0 ? visuals : undefined };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const emotions = metadata.emotions[formData.character] || ['normal'];
  const visuals = formData.visuals || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {isNew ? 'Add Script Line' : `Edit Line #${line.id}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Character */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Character</label>
            <select
              value={formData.character}
              onChange={(e) => handleChange('character', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {metadata.characters.filter(c => c.speakerId !== null).map((char) => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text (Voice)</label>
            <textarea
              value={formData.text}
              onChange={(e) => handleChange('text', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Voice generation text"
            />
          </div>

          {/* Display Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Text (optional)</label>
            <textarea
              value={formData.displayText || ''}
              onChange={(e) => handleChange('displayText', e.target.value || undefined)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Subtitle text (if different from voice)"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scene</label>
              <input
                type="number"
                value={formData.scene}
                onChange={(e) => handleChange('scene', parseInt(e.target.value, 10))}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emotion</label>
              <select
                value={formData.emotion || 'normal'}
                onChange={(e) => handleChange('emotion', e.target.value === 'normal' ? undefined : e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {emotions.map((emotion) => (
                  <option key={emotion} value={emotion}>{emotion}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pause After (frames)</label>
              <input
                type="number"
                value={formData.pauseAfter}
                onChange={(e) => handleChange('pauseAfter', parseInt(e.target.value, 10))}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Visuals */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">ビジュアル (Visuals)</h4>
              <button
                type="button"
                onClick={addVisual}
                className="px-3 py-1 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                ＋ ピンを追加
              </button>
            </div>

            {visuals.length === 0 && (
              <p className="text-xs text-gray-400">ピンなし（テキストから自動抽出）</p>
            )}

            {visuals.map((v, i) => (
              <div key={i} className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-600">
                    📌{visuals.length > 1 ? ` ${i + 1}` : ''}
                    {v.lineTo ? <span className="ml-1 text-amber-500">→ {v.lineTo}</span> : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeVisual(i)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    削除
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <select
                      value={v.type}
                      onChange={(e) => updateVisual(i, 'type', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {metadata.visualTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Animation</label>
                    <select
                      value={v.animation || 'fadeIn'}
                      onChange={(e) => updateVisual(i, 'animation', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {metadata.animations.map((anim) => (
                        <option key={anim} value={anim}>{anim}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      表示開始行 ID <span className="text-gray-400">（省略 = この行）</span>
                    </label>
                    <input
                      type="number"
                      value={v.lineFrom ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                        updateVisual(i, 'lineFrom', val);
                      }}
                      placeholder="例: 10"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      表示終了行 ID <span className="text-gray-400">（省略 = この行）</span>
                    </label>
                    <input
                      type="number"
                      value={v.lineTo ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                        updateVisual(i, 'lineTo', val);
                      }}
                      placeholder="例: 20"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                {(v.type === 'image' || v.type === 'video' || v.type === 'svg-file') && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Source</label>
                      <input
                        type="text"
                        value={v.src || ''}
                        onChange={(e) => updateVisual(i, 'src', e.target.value)}
                        placeholder={v.type === 'svg-file' ? 'svg/filename.svg' : 'filename (in public/content/)'}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                      />
                    </div>
                    {v.type === 'video' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start From (frames)</label>
                        <input
                          type="number"
                          value={v.startFrom ?? 0}
                          onChange={(e) => updateVisual(i, 'startFrom', parseInt(e.target.value, 10) || 0)}
                          min={0}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {v.type === 'text' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">数式テキスト</label>
                      <textarea
                        value={v.text || ''}
                        onChange={(e) => updateVisual(i, 'text', e.target.value)}
                        placeholder="$$\frac{a}{b}$$"
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                        <input
                          type="number"
                          value={v.fontSize || 64}
                          onChange={(e) => updateVisual(i, 'fontSize', parseInt(e.target.value, 10))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Color</label>
                        <input
                          type="color"
                          value={v.color || '#ffffff'}
                          onChange={(e) => updateVisual(i, 'color', e.target.value)}
                          className="w-full h-8 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sound Effect */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sound Effect</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">SE Source</label>
                <input
                  type="text"
                  value={formData.se?.src || ''}
                  onChange={(e) => handleSeChange('src', e.target.value)}
                  placeholder="filename.mp3 (in public/se/)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Volume (0-1)</label>
                <input
                  type="number"
                  value={formData.se?.volume || 1}
                  onChange={(e) => handleSeChange('volume', parseFloat(e.target.value))}
                  min={0} max={1} step={0.1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
