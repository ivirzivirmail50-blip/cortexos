'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ProviderConfig {
  provider: string;
  model: string;
}

interface ProviderContextType {
  config: ProviderConfig;
  setConfig: (c: ProviderConfig) => void;
}

const ProviderContext = createContext<ProviderContextType>({
  config: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  setConfig: () => {},
});

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<ProviderConfig>({
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.provider) setConfigState({ provider: d.provider, model: d.model });
    });
  }, []);

  const setConfig = (c: ProviderConfig) => {
    setConfigState(c);
    fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    });
  };

  return <ProviderContext.Provider value={{ config, setConfig }}>{children}</ProviderContext.Provider>;
}

export const useProvider = () => useContext(ProviderContext);
