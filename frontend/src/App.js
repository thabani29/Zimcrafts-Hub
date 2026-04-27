import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import Layout from './components/common/Layout';

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

function App() {
    return ( <
        AuthProvider >
        <
        CartProvider >
        <
        Router >
        <
        Layout >
        <
        Routes >

        { /* Home */ } <
        Route path = "/"
        element = { < Home / > }
        />

        { /* Products */ } <
        Route path = "/products"
        element = { < Products / > }
        /> <
        Route path = "/products/category/:categoryId"
        element = { < Products / > }
        /> <
        Route path = "/products/:id"
        element = { < ProductDetail / > }
        />

        { /* Cart & Checkout */ } <
        Route path = "/cart"
        element = { < Cart / > }
        /> <
        Route path = "/checkout"
        element = { < Checkout / > }
        /> <
        Route path = "/order-success/:id"
        element = { < OrderSuccess / > }
        /> <
        Route path = "/payment-success"
        element = { < PaymentSuccess / > }
        /> <
        Route path = "/payment-cancel"
        element = { < PaymentCancel / > }
        /> <
        Route path = "/tutorial-payment-success"
        element = { < TutorialPaymentSuccess / > }
        /> <
        Route path = "/tutorial-payment-cancel"
        element = { < TutorialPaymentCancel / > }
        /> <
        Route path = "/orders"
        element = { < Orders / > }
        /> <
        Route path = "/seller-orders"
        element = { < SellerOrders / > }
        />

        { /* Seller */ } <
        Route path = "/seller-dashboard"
        element = { < SellerDashboard / > }
        /> <
        Route path = "/upload-product"
        element = { < UploadProduct / > }
        /> <
        Route path = "/edit-product/:id"
        element = { < UploadProduct / > }
        />

        { /* Tutorials */ } <
        Route path = "/upload-tutorial"
        element = { < UploadTutorial / > }
        /> <
        Route path = "/tutorials"
        element = { < TutorialList / > }
        /> <
        Route path = "/tutorials/:id"
        element = { < CoursePlayer / > }
        /> <
        Route path = "/tutorials/:id/exam"
        element = { < Exam / > }
        /> <
        Route path = "/tutorials/:id/result"
        element = { < Result / > }
        />

        { /* Certificate */ } <
        Route path = "/certificate/:tutorialId/:userId"
        element = { < Certificate / > }
        />

        { /* Auth */ } <
        Route path = "/login"
        element = { < LoginPage / > }
        /> <
        Route path = "/register"
        element = { < RegisterPage / > }
        /> <
        Route path = "/verify-email/:token"
        element = { < VerifyEmail / > }
        />

        <
        /Routes> <
        /Layout> <
        /Router> <
        /CartProvider> <
        /AuthProvider>
    );
}

export default App;
