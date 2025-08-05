import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import SignUp from "./pages/general-pages/SignUp";
import SignIn from "./pages/general-pages/SignIn";
import GeneralDashboard from "./pages/general-pages/GeneralDashboard";
import Profile from "./pages/general-pages/Profile";
import LikedItems from "./pages/general-pages/LikedItems";
import CustomerService from "./pages/general-pages/CustomerService";
import Help from "./pages/general-pages/Help";
import ManageListing from "./pages/general-pages/ManageListing";
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
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/dashboard" element={<GeneralDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/liked-items" element={<LikedItems />} />
          <Route path="/customer-service" element={<CustomerService />} />
          <Route path="/help" element={<Help />} />
          <Route path="/manage-listing" element={<ManageListing />} />
          <Route path="/orders-meetups" element={<OrdersMeetups />} />
          <Route
            path="/buyer/view-product-details/:id?"
            element={<ViewProductDetails />}
          />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
