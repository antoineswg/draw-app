export const createMyUser = (username: string) => {
  const avatar = `https://api.dicebear.com/9.x/dylan/svg?seed=${username.toUpperCase()}`;
  return {
    username,
    avatar
  };
}
