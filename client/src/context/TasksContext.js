// client/src/context/TasksContext.js
import { createContext, useContext, useMemo, useReducer, useEffect } from "react";

const TasksContext = createContext(null);
const LS_KEY = "tasks_by_project_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
function save(state) { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

function reducer(state, action) {
  switch (action.type) {
    case "create": {
      const { projectId, task } = action.payload;
      const list = state[projectId] || [];
      return { ...state, [projectId]: [...list, task] };
    }
    case "update": {
      const { projectId, id, patch } = action.payload;
      const list = (state[projectId] || []).map(t => t.id === id ? { ...t, ...patch } : t);
      return { ...state, [projectId]: list };
    }
    case "remove": {
      const { projectId, id } = action.payload;
      const list = (state[projectId] || []).filter(t => t.id !== id);
      return { ...state, [projectId]: list };
    }
    default:
      return state;
  }
}

export function TasksProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {}, load);
  useEffect(() => { save(state); }, [state]);

  const api = useMemo(() => ({
    listByProject: (projectId) => state[projectId] || [],
    create: (projectId, task) => {
      const id = (crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
      const now = new Date().toISOString();
      const full = { id, createdAt: now, updatedAt: now, status: "todo", priority: "normal", ...task };
      dispatch({ type: "create", payload: { projectId, task: full } });
      return full;
    },
    update: (projectId, id, patch) => {
      dispatch({ type: "update", payload: { projectId, id, patch: { ...patch, updatedAt: new Date().toISOString() } } });
    },
    remove: (projectId, id) => {
      dispatch({ type: "remove", payload: { projectId, id } });
    },
  }), [state]);

  return <TasksContext.Provider value={api}>{children}</TasksContext.Provider>;
}
export const useTasks = () => useContext(TasksContext);
