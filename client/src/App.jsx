import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
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
import SellerProductDetails from "./pages/seller-pages/SellerProductDetails";

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
          <Route path="/orders" element={<OrdersMeetups />} />
          {/* Redirect old URL to new URL for backward compatibility */}
          <Route path="/orders-meetups" element={<Navigate to="/orders" replace />} />
          <Route
            path="/buyer/view-product-details/:id?"
            element={<ViewProductDetails />}
          />
          <Route
            path="/seller/view-product-details/:id?"
            element={<SellerProductDetails />}
          />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
