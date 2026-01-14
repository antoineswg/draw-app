import { useState } from "react";
import { useMyUserStore } from "../../../features/user/store/useMyUserStore";
import { MyUserBadge } from "../../../features/user/components/MyUserBadge/MyUserBadge";

type AppHeaderProps = {
  onClickJoin: (username: string) => void;
};

export function AppHeader({ onClickJoin }: AppHeaderProps) {
  const myUser = useMyUserStore().myUser;
  const [username, setUsername] = useState('');

  const handleJoin = () => {
    if (username.trim()) {
      onClickJoin(username.trim());
    }
  };

  return (
    <div className="join items-center justify-between gap-4 w-full">
      <h1 className="join-item text-5xl font-bold">MMI3 Draw App</h1>
      {myUser ?
      <MyUserBadge username={myUser.username} avatar={myUser.avatar} />
        :
        <div className="join-item flex gap-2">
          <input 
            type="text" 
            placeholder="Enter your username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            className="input input-bordered"
          />
          <button className="btn btn-primary" onClick={handleJoin}>Rejoindre</button>
        </div>
    }
    </div>
  )
}