import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";

const ProjectsContext = createContext(null);

const initial = () => {
    try { return JSON.parse(localStorage.getItem("projects") || "[]"); }
    catch { return []; }
};

function reducer(state, action) {
    switch (action.type) {
        case "create":
            return [...state, action.payload];
        case "update":
            return state.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p);
        case "remove":
            return state.filter(p => p.id !== action.payload);
        case "pin":
            return state.map(p => p.id === action.payload ? { ...p, pinned: !p.pinned } : p);
        case "bulk":
            return action.payload;
        default:
            return state;
    }
}

export function ProjectsProvider({ children }) {
    const [projects, dispatch] = useReducer(reducer, [], initial);

    useEffect(() => {
        localStorage.setItem("projects", JSON.stringify(projects));
    }, [projects]);

    const [currentId, setCurrentId] = useState(() => localStorage.getItem("currentProjectId") || null);
    useEffect(() => {
        if (currentId) localStorage.setItem("currentProjectId", currentId);
    }, [currentId]);

    const api = useMemo(() => ({
        list: () => projects,
        create: (data) => {
            const now = Date.now();
            const payload = {
                id: crypto.randomUUID(),
                name: data.name,
                description: data.description || "",
                color: data.color || "#2ecc71",
                createdAt: now,
                startDate: data.startDate || null,
                dueDate: data.dueDate || null,
                stats: { tasks: 0, unread: 0, upcoming: 0, progress: 0 },
                pinned: false,
            };
            dispatch({ type: "create", payload });
            return payload;
        },
        update: (p) => dispatch({ type: "update", payload: p }),
        remove: (id) => dispatch({ type: "remove", payload: id }),
        pin: (id) => dispatch({ type: "pin", payload: id }),
        select: (id) => setCurrentId(id),
        currentId,
        current: () => projects.find(p => p.id === currentId) || null,
    }), [projects, currentId]);


    return < ProjectsContext.Provider value = { api } > { children }</ProjectsContext.Provider >;
}

export const useProjects = () => useContext(ProjectsContext);
