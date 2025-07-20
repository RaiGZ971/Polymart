import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import { LandingPage, SignUp, SignIn } from './pages'
import NotificationTest from "./pages/general-pages/NotificationTest";
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/notification-test" element={<NotificationTest />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
