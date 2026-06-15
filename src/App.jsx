import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import RecipePage from './pages/RecipePage'
import AddRecipePage from './pages/AddRecipePage'

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/add" element={<AddRecipePage />} />
      </Routes>
    </>
  )
}
