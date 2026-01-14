import { create } from 'zustand'
import type { User } from '../../../shared/types/user.type';

type UserState = {
  userList: User[];
  // map des utilisateurs en train de dessiner
  drawingUsers: Map<string, boolean>;
}

type UserAction = {
  setUserList: (users: User[]) => void;
  // marque un utilisateur comme dessinant
  setUserDrawing: (userId: string, isDrawing: boolean) => void;
};

export const useUserListStore = create<UserState & UserAction>((set) => ({
  userList: [],
  drawingUsers: new Map(),
  setUserList: (userList) => set({ userList }),
  setUserDrawing: (userId, isDrawing) => set((state) => {
    const newDrawingUsers = new Map(state.drawingUsers);
    if (isDrawing) {
      newDrawingUsers.set(userId, true);
    } else {
      newDrawingUsers.delete(userId);
    }
    return { drawingUsers: newDrawingUsers };
  })
}));