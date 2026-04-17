import { Navigate, createHashRouter } from 'react-router-dom'
import { ConfigPage } from '../pages/ConfigPage/ConfigPage'
import { WatchPage } from '../pages/WatchPage/WatchPage'
import { SchedulePage } from '../pages/SchedulePage/SchedulePage'
import { SharePage } from '../pages/SharePage/SharePage'

export function createAppRouter() {
  return createHashRouter([
    {
      path: '/',
      element: <Navigate to="/watch" replace />,
    },
    {
      path: '/watch',
      element: <WatchPage />,
    },
    {
      path: '/config',
      element: <ConfigPage />,
    },
    {
      path: '/schedule',
      element: <SchedulePage />,
    },
    {
      path: '/share/:payload',
      element: <SharePage />,
    },
  ])
}
