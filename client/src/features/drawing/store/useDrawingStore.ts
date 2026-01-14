import { create } from 'zustand'

type DrawingState = {
  strokeWidth: number;
  strokeColor: string;
  // fonction d'export définie par le composant DrawArea
  exportCanvas: (() => void) | null;
}

type DrawingAction = {
  setStrokeWidth: (width: number) => void;
  setStrokeColor: (color: string) => void;
  setExportCanvas: (fn: () => void) => void;
};

export const useDrawingStore = create<DrawingState & DrawingAction>((set) => ({
  strokeWidth: 2,
  strokeColor: '#000000',
  exportCanvas: null,
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setExportCanvas: (fn) => set({ exportCanvas: fn }),
}));