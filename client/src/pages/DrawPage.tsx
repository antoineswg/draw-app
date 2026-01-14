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
import { useDrawingStore } from '../features/drawing/store/useDrawingStore'
import { useState, useEffect } from 'react'

function DrawPage() {
  const { joinMyUser }  = useJoinMyUser();
  const { userList } = useUpdatedUserList();
  const myUser = useMyUserStore((state) => state.myUser);
  const exportCanvas = useDrawingStore((state) => state.exportCanvas);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // détection des changements de mode plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // bascule entre plein écran et mode normal
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

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
            <>
              <button 
                onClick={() => exportCanvas?.()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
              >
                Exporter en PNG
              </button>
              <button 
                onClick={() => {
                  SocketManager.emit('clear:canvas');
                }}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
              >
                Clear Canvas
              </button>
            </>
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
      
      {/* bouton plein écran fixe en bas à droite */}
      <button 
        onClick={toggleFullscreen}
        className="fixed bottom-4 right-4 p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        )}
      </button>
    </DrawLayout>
  )
}

export default DrawPage;
