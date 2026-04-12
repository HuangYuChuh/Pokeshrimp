"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";

// --- Types ---

export interface Session {
  id: string;
  title: string;
  createdAt: string;
}

export type PreviewTab = "preview" | "editor" | "output";

export interface PreviewContent {
  type: "image" | "video" | "audio" | "text" | "none";
  url?: string;
  text?: string;
}

export interface OutputFile {
  name: string;
  path: string;
  type: string;
}

export interface AppState {
  sessions: Session[];
  currentSessionId: string | null;
  previewTab: PreviewTab;
  previewContent: PreviewContent;
  editorParams: string;
  outputFiles: OutputFile[];
  loading: boolean;
}

// --- Actions ---

export type AppAction =
  | { type: "SET_SESSIONS"; sessions: Session[] }
  | { type: "SET_CURRENT_SESSION"; id: string | null }
  | { type: "ADD_SESSION"; session: Session }
  | { type: "REMOVE_SESSION"; id: string }
  | { type: "SET_PREVIEW_TAB"; tab: PreviewTab }
  | { type: "SET_PREVIEW_CONTENT"; content: PreviewContent }
  | { type: "SET_EDITOR_PARAMS"; params: string }
  | { type: "SET_OUTPUT_FILES"; files: OutputFile[] }
  | { type: "SET_LOADING"; loading: boolean };

// --- Reducer ---

const initialState: AppState = {
  sessions: [],
  currentSessionId: null,
  previewTab: "preview",
  previewContent: { type: "none" },
  editorParams: "{}",
  outputFiles: [],
  loading: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_SESSIONS":
      return { ...state, sessions: action.sessions };
    case "SET_CURRENT_SESSION":
      return { ...state, currentSessionId: action.id };
    case "ADD_SESSION":
      return {
        ...state,
        sessions: [action.session, ...state.sessions],
        currentSessionId: action.session.id,
      };
    case "REMOVE_SESSION": {
      const filtered = state.sessions.filter((s) => s.id !== action.id);
      return {
        ...state,
        sessions: filtered,
        currentSessionId:
          state.currentSessionId === action.id ? null : state.currentSessionId,
      };
    }
    case "SET_PREVIEW_TAB":
      return { ...state, previewTab: action.tab };
    case "SET_PREVIEW_CONTENT":
      return { ...state, previewContent: action.content };
    case "SET_EDITOR_PARAMS":
      return { ...state, editorParams: action.params };
    case "SET_OUTPUT_FILES":
      return { ...state, outputFiles: action.files };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

// --- Context ---

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}
