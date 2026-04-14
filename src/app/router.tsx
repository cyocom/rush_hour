import { Navigate, createBrowserRouter } from 'react-router-dom'
import { ConfigPage } from '../pages/ConfigPage/ConfigPage'
import { WatchPage } from '../pages/WatchPage/WatchPage'

export function createAppRouter() {
  const baseName = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

  return createBrowserRouter(
    [
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
    ],
    {
      basename: baseName,
    },
  )
}
