import { useUserListStore } from '../../store/useUserListStore';

export type UserListProps = {
  users: {
    id: string;
    username: string;
    avatar: string;
  }[] /* Ici je précise explicitement que j'attends non pas un type User, mais un un array d'objets avec une clé id, username & avatar. --> Ca rend mes composants bien plus indépendants & réutilisables */
}

export function UserList({ users }: UserListProps){
  // récupération de l'état de dessin des utilisateurs
  const drawingUsers = useUserListStore((state) => state.drawingUsers);
  // récupération des couleurs de tracé des utilisateurs
  const userStrokeColor = useUserListStore((state) => state.userStrokeColor);
  
  return (
    <div className="flex flex-col gap-3">
      <span className="font-bold">Liste des utilisateurs: <div className="badge badge-soft badge-info">{users.length}</div></span>

      <ul className="list bg-base-100 rounded-box shadow-md">
        {users.length > 0 ? 
          users.map((user) => (
            <li className="list-row items-center" key={user.id}>
              <div className="relative">
                {/* border verte si l'utilisateur dessine */}
                <img 
                  className={`size-8 rounded-box ${drawingUsers.get(user.id) ? 'ring-2 ring-green-500' : ''}`} 
                  src={user.avatar} 
                />
                {/* pastille de couleur en bas à droite de l'avatar */}
                <div 
                  className="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white" 
                  style={{ backgroundColor: userStrokeColor.get(user.id) || '#000000' }}
                  title={`Couleur: ${userStrokeColor.get(user.id) || '#000000'}`}
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className="text-xs uppercase font-semibold">{user.username}</div>
              </div>
            </li>
          ))
        :
        <li className="list-row opacity-50">Pas d'utilisateur connecté actuellement.<br /> Rejoignez la partie pour pouvoir dessiner.</li>
      }
      </ul>
    </div>
  )
}