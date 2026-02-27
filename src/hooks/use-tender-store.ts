import { create } from 'zustand';

interface TenderState {
  currentTenderId: string | null;
  isAnalyzing: boolean;
  isGenerating: boolean;
  isExporting: boolean;
  analysisProgress: number;
  generationProgress: number;
  error: string | null;

  setCurrentTender: (id: string | null) => void;
  setAnalyzing: (value: boolean) => void;
  setGenerating: (value: boolean) => void;
  setExporting: (value: boolean) => void;
  setAnalysisProgress: (value: number) => void;
  setGenerationProgress: (value: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useTenderStore = create<TenderState>((set) => ({
  currentTenderId: null,
  isAnalyzing: false,
  isGenerating: false,
  isExporting: false,
  analysisProgress: 0,
  generationProgress: 0,
  error: null,

  setCurrentTender: (id) => set({ currentTenderId: id }),
  setAnalyzing: (value) => set({ isAnalyzing: value }),
  setGenerating: (value) => set({ isGenerating: value }),
  setExporting: (value) => set({ isExporting: value }),
  setAnalysisProgress: (value) => set({ analysisProgress: value }),
  setGenerationProgress: (value) => set({ generationProgress: value }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      isAnalyzing: false,
      isGenerating: false,
      isExporting: false,
      analysisProgress: 0,
      generationProgress: 0,
      error: null,
    }),
}));

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
      return { theme: newTheme };
    }),
  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    set({ theme });
  },
}));
