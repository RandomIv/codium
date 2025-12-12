import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Language } from '@/types/enums';
import type { TestLogs } from '@/types/test-log';

interface WorkspaceState {
  language: Language;
  codes: Record<string, string>;
  testLogs: TestLogs | null;
  isRunning: boolean;
  activeProblemId: string | null;
  solutions: Record<string, Record<string, string>>;

  setLanguage: (language: Language) => void;
  setCode: (code: string) => void;
  initializeCode: (
    problemId: string,
    starterCode: Record<string, string>,
  ) => void;
  setTestLogs: (testLogs: TestLogs | null) => void;
  setIsRunning: (isRunning: boolean) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      language: Language.JAVASCRIPT,
      codes: { [Language.JAVASCRIPT]: '', [Language.PYTHON]: '' },
      testLogs: null,
      isRunning: false,
      activeProblemId: null,
      solutions: {},

      setLanguage: (language) => set({ language }),

      setCode: (code) => {
        const { activeProblemId, language, solutions, codes } = get();

        const newCodes = { ...codes, [language]: code };

        let newSolutions = solutions;
        if (activeProblemId) {
          newSolutions = {
            ...solutions,
            [activeProblemId]: {
              ...(solutions[activeProblemId] || {}),
              [language]: code,
            },
          };
        }

        set({ codes: newCodes, solutions: newSolutions });
      },

      initializeCode: (problemId, starterCode) => {
        const state = get();

        if (state.activeProblemId === problemId) return;

        const savedSolution = state.solutions[problemId] || {};
        const mergedCodes = { ...starterCode, ...savedSolution };

        set({
          activeProblemId: problemId,
          codes: mergedCodes,
          testLogs: null,
        });
      },

      setTestLogs: (testLogs) => set({ testLogs }),
      setIsRunning: (isRunning) => set({ isRunning }),
      reset: () =>
        set({
          language: Language.JAVASCRIPT,
          codes: { [Language.JAVASCRIPT]: '', [Language.PYTHON]: '' },
          testLogs: null,
          isRunning: false,
          activeProblemId: null,
        }),
    }),
    {
      name: 'codium-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        activeProblemId: state.activeProblemId,
        solutions: state.solutions,
        codes: state.codes,
      }),
    },
  ),
);
