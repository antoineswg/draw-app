import { create } from 'zustand'

type DrawingState = {
  strokeWidth: number;
  strokeColor: string;
}

type DrawingAction = {
  setStrokeWidth: (width: number) => void;
  setStrokeColor: (color: string) => void;
};

export const useDrawingStore = create<DrawingState & DrawingAction>((set) => ({
  strokeWidth: 2,
  strokeColor: '#000000',
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setStrokeColor: (color) => set({ strokeColor: color }),
}));