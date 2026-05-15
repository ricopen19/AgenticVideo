interface HeaderProps {
  currentTab: 'script' | 'settings';
  onTabChange: (tab: 'script' | 'settings') => void;
}

export function Header({ currentTab, onTabChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-800">Script Editor</h1>
        <span className="text-gray-400 text-sm">Remotion + VOICEVOX</span>
      </div>
      <nav className="flex gap-1">
        <button
          onClick={() => onTabChange('script')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'script'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Script
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            currentTab === 'settings'
              ? 'bg-indigo-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Settings
        </button>
      </nav>
    </header>
  );
}
