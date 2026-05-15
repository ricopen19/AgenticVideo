import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ScriptTable } from './components/script/ScriptTable';
import { SettingsForm } from './components/settings/SettingsForm';
import { useScript } from './hooks/useScript';
import { useSettings } from './hooks/useSettings';
import { useMetadata } from './hooks/useMetadata';

function App() {
  const [currentTab, setCurrentTab] = useState<'script' | 'settings'>('script');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplyingVisuals, setIsApplyingVisuals] = useState(false);

  const { script, loading: scriptLoading, error: scriptError, updateLine, createLine, deleteLine, moveUp, moveDown, insertAt, bulkImport, refresh: refreshScript } = useScript();
  const { settings, loading: settingsLoading, error: settingsError, updateSettings, refresh: refreshSettings } = useSettings();
  const { metadata, loading: metadataLoading } = useMetadata();

  const handlePreview = () => {
    window.open('http://localhost:3000', '_blank');
  };

  const handleGenerateVoices = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/actions/generate-voices', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate voices');
      const result = await res.json();
      alert(result.message || 'Voices generated successfully!');
      refreshScript();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate voices');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyVisuals = async () => {
    setIsApplyingVisuals(true);
    try {
      const res = await fetch('/api/actions/apply-visuals', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to apply visuals');
      const result = await res.json();
      alert(result.message);
      refreshScript();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to apply visuals');
    } finally {
      setIsApplyingVisuals(false);
    }
  };

  const handleBuildVideo = async () => {
    try {
      const res = await fetch('/api/actions/build-video', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start build');
      const result = await res.json();
      alert(result.message || 'Video build started!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to build video');
    }
  };

  const loading = scriptLoading || settingsLoading || metadataLoading;
  const error = scriptError || settingsError;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />
      <div className="flex flex-1">
        <Sidebar
          onPreview={handlePreview}
          onGenerateVoices={handleGenerateVoices}
          onBuildVideo={handleBuildVideo}
          onApplyVisuals={handleApplyVisuals}
          isGenerating={isGenerating}
          isApplyingVisuals={isApplyingVisuals}
        />
        <main className="flex-1 p-6 overflow-auto">
          {currentTab === 'script' && metadata && (
            <ScriptTable
              script={script}
              metadata={metadata}
              onUpdate={updateLine}
              onCreate={createLine}
              onDelete={deleteLine}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onInsertAt={insertAt}
              onBulkImport={bulkImport}
            />
          )}
          {currentTab === 'settings' && settings && (
            <SettingsForm
              settings={settings}
              onSave={async (data) => {
                await updateSettings(data);
                refreshSettings();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
