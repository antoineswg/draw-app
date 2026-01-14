import { AppHeader } from '../shared/components/AppHeader/AppHeader'
import { DrawLayout } from '../shared/components/layouts/DrawLayout/DrawLayout'

import { Instructions } from '../shared/components/Instructions/Instructions'
import { getInstructions } from '../shared/utils/get-instructions'
import { UserList } from '../features/user/components/UserList'
import { DrawArea } from '../features/drawing/components/DrawArea'
import { DrawToolbar } from '../features/drawing/components/DrawToolbar'
import { useUpdatedUserList } from '../features/user/hooks/useUpdatedUserList'
import { useJoinMyUser } from '../features/user/hooks/useJoinMyUser'
import { SocketManager } from '../shared/services/SocketManager'
import { useMyUserStore } from '../features/user/store/useMyUserStore'

function DrawPage() {
  const { joinMyUser }  = useJoinMyUser();
  const { userList } = useUpdatedUserList();
  const myUser = useMyUserStore((state) => state.myUser);

  return (
    <DrawLayout
      topArea={<AppHeader 
        onClickJoin={(username) => joinMyUser(username)}
      />}
      rightArea={
        <>
          {/* <Instructions>
            {getInstructions('user-list')}
          </Instructions> */}
          <UserList users={userList} />
          {myUser && (
            <button 
              onClick={() => {
                SocketManager.emit('clear:canvas');
              }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
            >
              Clear Canvas
            </button>
          )}
        </>
      }
      bottomArea={
        <>
          <DrawToolbar />
          {/* <Instructions>
            {getInstructions('toolbar')}
          </Instructions> */}
        </>
      }
    >
      <DrawArea />
      {/* <TestDrawArea /> */}
      {/* <Instructions className="max-w-xs">
        {getInstructions('draw-area')}
      </Instructions> */}
      
    </DrawLayout>
  )
}

export default DrawPage;
