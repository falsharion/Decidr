import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import HomePage from './pages/Homepage'
import CoinPage from './pages/CoinPage'
import ProsConsPage from './pages/ProsConsPage'
import BracketPage from './pages/BracketPage'
import PlannerPage from './pages/PlannerPage'
import HistoryPage from './pages/HistoryPage'
import SharePage from './pages/SharePage'
import NotFoundPage from './pages/NotFoundPage'
import ClarityEnginePage from './pages/ClarityEnginePage'

export default function App() {
  return (
    <>
      <div className="bg-grain" />
      <div className="bg-glow" />
      <div className="wrap">
        <Navbar />
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/coin"        element={<CoinPage />} />
          <Route path="/pros-cons"  element={<ProsConsPage />} />
          <Route path="/bracket"    element={<BracketPage />} />
          <Route path="/planner"    element={<PlannerPage />} />
          <Route path="/clarity" element={<ClarityEnginePage />} />
          <Route path="/history"    element={<HistoryPage />} />
          <Route path="/share"      element={<SharePage />} />
          <Route path="*"           element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  )
}