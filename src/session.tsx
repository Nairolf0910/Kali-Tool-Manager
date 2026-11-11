import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { NetworkMode } from './types';

interface SessionState {
  authenticated: boolean;
  password: string;
  networkMode: NetworkMode;
  monitorInterface: string | null;
  savePath: string;
  setAuthenticated: (v: boolean) => void;
  setPassword: (p: string) => void;
  setNetworkMode: (m: NetworkMode) => void;
  setMonitorInterface: (iface: string | null) => void;
  setSavePath: (p: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [networkMode, setNetworkMode] = useState<NetworkMode>('normal');
  const [monitorInterface, setMonitorInterface] = useState<string | null>(null);
  const [savePath, setSavePath] = useState('/root/kali-ui-exports');

  const logout = useCallback(() => {
    setAuthenticated(false);
    setPassword('');
    setNetworkMode('normal');
    setMonitorInterface(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        authenticated,
        password,
        networkMode,
        monitorInterface,
        savePath,
        setAuthenticated,
        setPassword,
        setNetworkMode,
        setMonitorInterface,
        setSavePath,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
