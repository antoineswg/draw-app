import { create } from 'zustand'
import type { User } from '../../../shared/types/user.type';

type UserState = {
  userList: User[];
  // map des utilisateurs en train de dessiner
  drawingUsers: Map<string, boolean>;
  // map des couleurs de tracé des utilisateurs
  userStrokeColor: Map<string, string>;
}

type UserAction = {
  setUserList: (users: User[]) => void;
  // marque un utilisateur comme dessinant
  setUserDrawing: (userId: string, isDrawing: boolean) => void;
  // enregistre la couleur de tracé d'un utilisateur
  setUserStrokeColor: (userId: string, color: string) => void;
};

export const useUserListStore = create<UserState & UserAction>((set) => ({
  userList: [],
  drawingUsers: new Map(),
  userStrokeColor: new Map(),
  setUserList: (userList) => set({ userList }),
  setUserDrawing: (userId, isDrawing) => set((state) => {
    const newDrawingUsers = new Map(state.drawingUsers);
    if (isDrawing) {
      newDrawingUsers.set(userId, true);
    } else {
      newDrawingUsers.delete(userId);
    }
    return { drawingUsers: newDrawingUsers };
  }),
  setUserStrokeColor: (userId, color) => set((state) => {
    const newUserStrokeColor = new Map(state.userStrokeColor);
    newUserStrokeColor.set(userId, color);
    return { userStrokeColor: newUserStrokeColor };
  })
}));