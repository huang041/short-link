import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import CreateUrl from './pages/CreateUrl'
import Analytics from './pages/Analytics'
import Referrals from './pages/Referrals'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CreateUrl />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
