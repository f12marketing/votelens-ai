import React from 'react';
import { X, Save, RotateCcw } from 'lucide-react';

interface AnchorConfig {
  style: 'news' | 'sports' | 'documentary';
  pacing: 'slow' | 'normal' | 'fast';
  detailLevel: 'brief' | 'standard' | 'detailed';
  includeNumbers: boolean;
  includePercentages: boolean;
  maxDuration: number;
  voice?: string;
  rate: number;
  pitch: number;
  volume: number;
}

interface AnchorSettingsProps {
  config: AnchorConfig;
  availableVoices: SpeechSynthesisVoice[];
  onSave: (config: AnchorConfig) => void;
  onCancel: () => void;
}

export const AnchorSettings: React.FC<AnchorSettingsProps> = ({
  config,
  availableVoices,
  onSave,
  onCancel,
}) => {
  const [localConfig, setLocalConfig] = React.useState<AnchorConfig>(config);

  const handleSave = () => {
    onSave(localConfig);
  };

  const handleReset = () => {
    setLocalConfig({
      style: 'news',
      pacing: 'normal',
      detailLevel: 'standard',
      includeNumbers: true,
      includePercentages: true,
      maxDuration: 60,
      voice: undefined,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    });
  };

  const applyPreset = (preset: 'news' | 'sports' | 'documentary') => {
    const presets: Record<string, Partial<AnchorConfig>> = {
      news: {
        style: 'news',
        pacing: 'normal',
        detailLevel: 'standard',
        includeNumbers: true,
        includePercentages: true,
        maxDuration: 60,
        rate: 1.0,
        pitch: 1.0,
      },
      sports: {
        style: 'sports',
        pacing: 'fast',
        detailLevel: 'brief',
        includeNumbers: true,
        includePercentages: true,
        maxDuration: 45,
        rate: 1.2,
        pitch: 1.1,
      },
      documentary: {
        style: 'documentary',
        pacing: 'slow',
        detailLevel: 'detailed',
        includeNumbers: true,
        includePercentages: true,
        maxDuration: 120,
        rate: 0.8,
        pitch: 0.9,
      },
    };
    setLocalConfig(prev => ({ ...prev, ...presets[preset] }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Anchor Settings</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Presets */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Presets</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => applyPreset('news')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  localConfig.style === 'news'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-semibold">News</div>
                <div className="text-sm text-gray-400 mt-1">
                  Professional tone, normal pace
                </div>
              </button>
              <button
                onClick={() => applyPreset('sports')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  localConfig.style === 'sports'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-semibold">Sports</div>
                <div className="text-sm text-gray-400 mt-1">
                  Energetic tone, fast pace
                </div>
              </button>
              <button
                onClick={() => applyPreset('documentary')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  localConfig.style === 'documentary'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-semibold">Documentary</div>
                <div className="text-sm text-gray-400 mt-1">
                  Analytical tone, slow pace
                </div>
              </button>
            </div>
          </div>

          {/* Commentary Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Commentary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pacing</label>
                <select
                  value={localConfig.pacing}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, pacing: e.target.value as any }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Detail Level</label>
                <select
                  value={localConfig.detailLevel}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, detailLevel: e.target.value as any }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  <option value="brief">Brief</option>
                  <option value="standard">Standard</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Duration (seconds)</label>
                <input
                  type="number"
                  value={localConfig.maxDuration}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, maxDuration: parseInt(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                  min="30"
                  max="300"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.includeNumbers}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, includeNumbers: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">Include Numbers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.includePercentages}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, includePercentages: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">Include Percentages</span>
              </label>
            </div>
          </div>

          {/* Voice Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Voice</h3>
            
            {availableVoices.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Voice</label>
                <select
                  value={localConfig.voice || ''}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, voice: e.target.value || undefined }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                >
                  <option value="">Default</option>
                  {availableVoices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Rate: {localConfig.rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={localConfig.rate}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Pitch: {localConfig.pitch.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={localConfig.pitch}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Volume: {Math.round(localConfig.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localConfig.volume}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Preview</h3>
            <button
              onClick={() => {
                const utterance = new SpeechSynthesisUtterance(
                  'This is a preview of how the anchor will sound with your current settings.'
                );
                utterance.rate = localConfig.rate;
                utterance.pitch = localConfig.pitch;
                utterance.volume = localConfig.volume;
                if (localConfig.voice) {
                  const voice = availableVoices.find(v => v.name === localConfig.voice);
                  if (voice) utterance.voice = voice;
                }
                window.speechSynthesis.speak(utterance);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Test Voice Settings
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
