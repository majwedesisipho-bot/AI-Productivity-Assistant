import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Priority = "High" | "Medium" | "Low";

export type Task = {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  dueDate: string;
  duration: number;
  category: string;
  done: boolean;
  source: "manual" | "meeting";
  owner?: string;
};

export type Activity = {
  id: string;
  tool: string;
  message: string;
  at: string;
};

export type SavedOutput = {
  id: string;
  tool: string;
  title: string;
  preview: string;
  at: string;
};

export type Settings = {
  theme: "light" | "dark";
  notifications: boolean;
  displayName: string;
};

type State = {
  tasks: Task[];
  activity: Activity[];
  outputs: SavedOutput[];
  settings: Settings;
  generationCount: number;
};

const STORAGE_KEY = "awpa:state:v1";

const initialState: State = {
  tasks: [],
  activity: [],
  outputs: [],
  settings: { theme: "light", notifications: true, displayName: "Sisipho" },
  generationCount: 0,
};

export const uid = () => Math.random().toString(36).slice(2, 10);

type Store = State & {
  addTasks: (tasks: Omit<Task, "id" | "done">[]) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  logActivity: (tool: string, message: string) => void;
  saveOutput: (tool: string, title: string, preview: string) => void;
  clearActivity: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

const AppStoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        setState({
          ...initialState,
          ...parsed,
          settings: { ...initialState.settings, ...(parsed.settings ?? {}) },
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  }, [state.settings.theme, hydrated]);

  const logActivity = useCallback((tool: string, message: string) => {
    setState((s) => ({
      ...s,
      activity: [{ id: uid(), tool, message, at: new Date().toISOString() }, ...s.activity].slice(
        0,
        30,
      ),
    }));
  }, []);

  const saveOutput = useCallback((tool: string, title: string, preview: string) => {
    setState((s) => ({
      ...s,
      generationCount: s.generationCount + 1,
      outputs: [
        { id: uid(), tool, title, preview: preview.slice(0, 240), at: new Date().toISOString() },
        ...s.outputs,
      ].slice(0, 12),
    }));
  }, []);

  const addTasks = useCallback((tasks: Omit<Task, "id" | "done">[]) => {
    setState((s) => ({
      ...s,
      tasks: [...s.tasks, ...tasks.map((t) => ({ ...t, id: uid(), done: false }))],
    }));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }, []);

  const clearActivity = useCallback(() => {
    setState((s) => ({ ...s, activity: [], outputs: [] }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      addTasks,
      updateTask,
      removeTask,
      logActivity,
      saveOutput,
      clearActivity,
      updateSettings,
    }),
    [
      state,
      addTasks,
      updateTask,
      removeTask,
      logActivity,
      saveOutput,
      clearActivity,
      updateSettings,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): Store {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
