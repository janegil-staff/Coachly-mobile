import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { logsApi } from "../services/api";

const LogsContext = createContext(null);

export function LogsProvider({ children }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await logsApi.list();
      setLogs(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message ?? "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveLog = useCallback(async (entry) => {
    const res = await logsApi.upsert(entry);
    const saved = res?.entry ?? entry;
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === saved.date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
    return res;
  }, []);

  const deleteLog = useCallback(async (date) => {
    await logsApi.remove(date);
    setLogs((prev) => prev.filter((l) => l.date !== date));
  }, []);

  const getLogForDate = useCallback(
    (date) => logs.find((l) => l.date === date) ?? null,
    [logs]
  );

  return (
    <LogsContext.Provider
      value={{ logs, loading, error, fetchLogs, saveLog, deleteLog, getLogForDate }}
    >
      {children}
    </LogsContext.Provider>
  );
}

export function useLogs() {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error("useLogs must be used within LogsProvider");
  return ctx;
}
