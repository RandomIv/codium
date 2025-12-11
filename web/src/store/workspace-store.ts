import { create } from 'zustand';
import { Language } from '@/types/enums';
import type { TestLogs } from '@/types/test-log';

interface WorkspaceState {
  language: Language;
  codes: Record<string, string>;
  testLogs: TestLogs | null;
  isRunning: boolean;

  setLanguage: (language: Language) => void;
  setCode: (code: string) => void;
  initializeCode: (starterCode: Record<string, string>) => void;
  setTestLogs: (testLogs: TestLogs | null) => void;
  setIsRunning: (isRunning: boolean) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  language: Language.JAVASCRIPT,
  codes: {
    [Language.JAVASCRIPT]: '',
    [Language.PYTHON]: '',
  },
  testLogs: null,
  isRunning: false,

  setLanguage: (language) => set({ language }),

  setCode: (code) =>
    set((state) => ({
      codes: { ...state.codes, [state.language]: code },
    })),

  initializeCode: (starterCode) =>
    set((state) => ({
      codes: { ...state.codes, ...starterCode },
    })),

  setTestLogs: (testLogs) => set({ testLogs }),

  setIsRunning: (isRunning) => set({ isRunning }),

  reset: () =>
    set({
      language: Language.JAVASCRIPT,
      codes: { [Language.JAVASCRIPT]: '', [Language.PYTHON]: '' },
      testLogs: null,
      isRunning: false,
    }),
}));
