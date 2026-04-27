import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const whatsappNumber = "263780759231"; 
  const whatsappMessage = "Hello%20ZimCraftHub%21%20I%20would%20like%20to%20know%20more%20about%20your%20products.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  
  const { getCartTotalItems } = useCart();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-brown text-white p-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity space-x-3">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg border-2 border-primary-yellow">
                <img 
                  src="/images/logos/logo.png" 
                  alt="ZimCraftHub Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden items-center justify-center w-full h-full">
                  <span className="text-primary-brown font-bold text-lg">ZCH</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold leading-tight">ZimCraftHub</h1>
              <p className="text-primary-yellow text-sm leading-tight">Zimbabwe Artisan Marketplace</p>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-4 md:space-x-6">
            <Link to="/" className="hover:text-primary-yellow transition-colors duration-300 font-medium py-2 px-3 rounded-lg hover:bg-white hover:bg-opacity-10">
              Home
            </Link>
            <Link to="/products" className="hover:text-primary-yellow transition-colors duration-300 font-medium py-2 px-3 rounded-lg hover:bg-white hover:bg-opacity-10">
              Products
            </Link>
            <Link to="/tutorials" className="hover:text-primary-yellow transition-colors duration-300 font-medium py-2 px-3 rounded-lg hover:bg-white hover:bg-opacity-10">
              Tutorials
            </Link>
            
            {/* Seller Dashboard Link - Only show if user is artisan */}
            {(user?.role === 'artisan/seller' || user?.role === 'artisan' || user?.role === 'admin') && (
              <Link 
                to="/seller-dashboard" 
                className="hover:text-primary-yellow transition-colors duration-300 font-medium py-2 px-3 rounded-lg hover:bg-white hover:bg-opacity-10"
              >
                Seller Dashboard
              </Link>
            )}
            
            <Link to="/cart" className="relative hover:text-primary-yellow transition-colors duration-300 font-medium py-2 px-3 rounded-lg hover:bg-white hover:bg-opacity-10 flex items-center space-x-1">
              <span>🛒</span>
              <span>Cart</span>
              {getCartTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartTotalItems()}
                </span>
              )}
            </Link>

            {/* User Authentication Links */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-yellow rounded-full flex items-center justify-center">
                    <span className="text-primary-brown font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm">Hi, {user.name}</span>
                </div>
                <button 
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login"
                  className="bg-primary-orange hover:bg-primary-yellow text-white py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Login
                </Link>
                <Link 
                  to="/register"
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            {/* WhatsApp Icon Button */}
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 flex items-center justify-center shadow-lg hover:shadow-xl"
              title="Chat with us on WhatsApp"
            >
              {/* WhatsApp Icon SVG */}
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.165-3.495-8.411"/>
              </svg>
            </a>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        {children}
      </main>
      
      <footer className="bg-primary-brown text-white p-6 mt-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-2 border-primary-yellow">
                  <img 
                    src="/images/logos/logo.png" 
                    alt="ZimCraftHub Logo" 
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden items-center justify-center w-full h-full">
                    <span className="text-primary-brown font-bold text-sm">ZCH</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-primary-yellow">ZimCraftHub</h3>
              </div>
              <p className="text-gray-300">Empowering Zimbabwean Artisans Through Digital Marketplace</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary-yellow">Quick Links</h3>
              <div className="flex flex-col space-y-2">
                <Link to="/" className="hover:text-primary-yellow transition-colors text-gray-300 hover:text-white">
                  Home
                </Link>
                <Link to="/products" className="hover:text-primary-yellow transition-colors text-gray-300 hover:text-white">
                  Products
                </Link>
                {user && (
                  <Link to="/orders" className="hover:text-primary-yellow transition-colors text-gray-300 hover:text-white">
                    My Orders
                  </Link>
                )}
                {(user?.role === 'artisan/seller' || user?.role === 'artisan' || user?.role === 'admin') && (
                  <Link to="/seller-dashboard" className="hover:text-primary-yellow transition-colors text-gray-300 hover:text-white">
                    Seller Dashboard
                  </Link>
                )}
                <Link to="/cart" className="hover:text-primary-yellow transition-colors text-gray-300 hover:text-white">
                  Cart
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary-yellow">Contact</h3>
              {/* WhatsApp Icon in Footer */}
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center space-x-2"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.165-3.495-8.411"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;