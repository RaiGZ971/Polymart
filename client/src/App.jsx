import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/general-pages/LandingPage";
import SignUp from "./pages/general-pages/SignUp";
import SignIn from "./pages/general-pages/SignIn";
import GeneralDashboard from "./pages/general-pages/GeneralDashboard";
import "bootstrap-icons/font/bootstrap-icons.css";
import OrdersMeetups from "./pages/general-pages/OrdersMeetups";
import ViewProductDetails from "./pages/buyer-pages/ViewProductDetails";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<GeneralDashboard />} />
          <Route path="/orders-meetups" element={<OrdersMeetups />} />
          <Route
            path="/buyer/view-product-details"
            element={<ViewProductDetails />}
          />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
