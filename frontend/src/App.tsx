import { NavLink, Route, Routes } from 'react-router-dom'
import QuestionPage from './pages/QuestionPage'
import PracticePage from './pages/PracticePage'
import RecordListPage from './pages/RecordListPage'
import RecordDetailPage from './pages/RecordDetailPage'

export default function App() {
  return (
    <div className="app">
      <nav className="menu">
        <NavLink to="/" end>연습하기</NavLink>
        <NavLink to="/records">기록</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<QuestionPage />} />
        <Route path="/practice/:questionId" element={<PracticePage />} />
        <Route path="/records" element={<RecordListPage />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
      </Routes>
    </div>
  )
}
