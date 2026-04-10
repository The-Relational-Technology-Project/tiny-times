import { useState, useEffect } from 'react';
import { TinyTimesConfig } from '@/lib/types';
import { ConfigScreen } from '@/components/ConfigScreen';
import { Newspaper } from '@/components/Newspaper';

const STORAGE_KEY = 'tiny-times-config';

function loadConfig(): TinyTimesConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.childName && parsed.anthropicApiKey && parsed.openaiApiKey) return parsed;
    return null;
  } catch { return null; }
}

function saveConfig(config: TinyTimesConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function Index() {
  const [config, setConfig] = useState<TinyTimesConfig | null>(loadConfig);
  const [showConfig, setShowConfig] = useState(!config);

  const handleSave = (c: TinyTimesConfig) => {
    saveConfig(c);
    setConfig(c);
    setShowConfig(false);
  };

  if (showConfig || !config) {
    return <ConfigScreen onSave={handleSave} initialConfig={config} />;
  }

  return <Newspaper config={config} onEditConfig={() => setShowConfig(true)} />;
}
