import LandingPage from "./pages/LandingPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Upload from "./pages/upload";
import Analytics from "./pages/Analytics";
import Forecast from "./pages/Forecast";
import Anomalies from "./pages/Anomalies";
import Chatbot from "./pages/Chatbot"
import ProtectedRoute from "./components/protectedRoute";
import Signup from "./pages/Signup";

import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PublicRoute from "./components/PublicRoute";

function App() {
  return (
    <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage/>}/>

          <Route path ="/signup" element ={<PublicRoute><Signup/></PublicRoute>}/>

          <Route path ="/login" element ={<PublicRoute><Login/></PublicRoute>}/>
          <Route
  path="/forgot-password"
  element={
    <PublicRoute>
      <ForgotPassword />
    </PublicRoute>
  }
/>

<Route
  path="/reset-password/:token"
  element={
    <PublicRoute>
      <ResetPassword />
    </PublicRoute>
  }
/>

          {/*Protected routes*/}

          <Route element={<ProtectedRoute><DashboardLayout/></ProtectedRoute>}>

            <Route path="/dashboard" element={<Dashboard/>}/>

            <Route path="/transactions" element={<Transactions/>}/>

            <Route path="/analytics" element={<Analytics/>}/>

            <Route path="/forecast" element={<Forecast/>}/>

            <Route path="/anomalies" element={<Anomalies/>}/>

            <Route path="/upload" element={<Upload/>}/>

            <Route path="/chatbot" element={<Chatbot/>} />

            <Route path ="/profile" element ={<Profile/>}/>

          </Route>

        </Routes>
    </BrowserRouter>
    );
    }

export default App;