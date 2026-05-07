import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import Layout from './components/common/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import SellerDashboard from './pages/SellerDashboard';
import UploadProduct from './pages/UploadProduct';
import UploadTutorial from './pages/UploadTutorial';
import TutorialList from './pages/TutorialList';
import CoursePlayer from './pages/CoursePlayer';
import Exam from './pages/Exam';
import Result from './pages/Result';
import Certificate from './pages/Certificate';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import TutorialPaymentSuccess from './pages/TutorialPaymentSuccess';
import TutorialPaymentCancel from './pages/TutorialPaymentCancel';
import Orders from './pages/Orders';
import SellerOrders from './pages/SellerOrders';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Home */}
              <Route path="/" element={<Home />} />

              {/* Products */}
              <Route path="/products" element={<Products />} />
              <Route path="/products/category/:categoryId" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />

              {/* Cart & Checkout */}
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-success/:id"
                element={
                  <ProtectedRoute>
                    <OrderSuccess />
                  </ProtectedRoute>
                }
              />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
              <Route path="/tutorial-payment-success" element={<TutorialPaymentSuccess />} />
              <Route path="/tutorial-payment-cancel" element={<TutorialPaymentCancel />} />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller-orders"
                element={
                  <ProtectedRoute>
                    <SellerOrders />
                  </ProtectedRoute>
                }
              />

              {/* Seller */}
              <Route
                path="/seller-dashboard"
                element={
                  <ProtectedRoute>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload-product"
                element={
                  <ProtectedRoute>
                    <UploadProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-product/:id"
                element={
                  <ProtectedRoute>
                    <UploadProduct />
                  </ProtectedRoute>
                }
              />

              {/* Tutorials */}
              <Route
                path="/upload-tutorial"
                element={
                  <ProtectedRoute>
                    <UploadTutorial />
                  </ProtectedRoute>
                }
              />
              <Route path="/tutorials" element={<TutorialList />} />
              <Route path="/tutorials/:id" element={<CoursePlayer />} />
              <Route
                path="/tutorials/:id/exam"
                element={
                  <ProtectedRoute>
                    <Exam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tutorials/:id/result"
                element={
                  <ProtectedRoute>
                    <Result />
                  </ProtectedRoute>
                }
              />

              {/* Certificate */}
              <Route
                path="/certificate/:tutorialId/:userId"
                element={
                  <ProtectedRoute>
                    <Certificate />
                  </ProtectedRoute>
                }
              />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Routes>
          </Layout>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
