import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import HomeScreen from "../screens/Home/HomeScreen";
import ProductListScreen from "../screens/Products/ProductListScreen";
import ProductDetailScreen from "../screens/Products/ProductDetailScreen";
import CheckoutScreen from "../screens/Orders/CheckoutScreen";
import OrdersScreen from "../screens/Orders/OrdersScreen";
import DashboardScreen from "../screens/Home/DashboardScreen";
import SellerOrdersScreen from "../screens/Orders/SellerOrdersScreen";
import WalletScreen from "../screens/Wallet/WalletScreen";
import TutorialsScreen from "../screens/Tutorials/TutorialsScreen";
import TutorialDetailScreen from "../screens/Tutorials/TutorialDetailScreen";
import TutorialRequestsScreen from "../screens/Tutorials/TutorialRequestsScreen";
import CoursePlayerScreen from "../screens/Tutorials/CoursePlayerScreen";
import ExamScreen from "../screens/Tutorials/ExamScreen";
import ResultScreen from "../screens/Tutorials/ResultScreen";
import CertificateScreen from "../screens/Tutorials/CertificateScreen";
import CartScreen from "../screens/Orders/CartScreen";
import PaymentStatusScreen from "../screens/Orders/PaymentStatusScreen";
import UploadProductScreen from "../screens/Products/UploadProductScreen";
import UploadTutorialScreen from "../screens/Tutorials/UploadTutorialScreen";
import OrderDetailScreen from "../screens/Orders/OrderDetailScreen";

import ProfileScreen from "../screens/Auth/ProfileScreen";
import UnifiedOrdersScreen from "../screens/Orders/UnifiedOrdersScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ExploreStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f7f2eb" } }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

function CartStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f7f2eb" } }}>
      <Stack.Screen name="CartMain" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="PaymentStatus" component={PaymentStatusScreen} />
    </Stack.Navigator>
  );
}

function AccountStackNavigator() {
  const { isArtisan } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f7f2eb" } }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="UploadProduct" component={UploadProductScreen} />
      <Stack.Screen name="UploadTutorial" component={UploadTutorialScreen} />
    </Stack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f7f2eb" } }}>
      <Stack.Screen name="OrdersMain" component={UnifiedOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function TutorialsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f7f2eb" } }}>
      <Stack.Screen name="TutorialList" component={TutorialsScreen} />
      <Stack.Screen name="TutorialDetail" component={TutorialDetailScreen} />
      <Stack.Screen name="TutorialRequests" component={TutorialRequestsScreen} />
      <Stack.Screen name="CoursePlayer" component={CoursePlayerScreen} />
      <Stack.Screen name="Exam" component={ExamScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="Certificate" component={CertificateScreen} />
    </Stack.Navigator>
  );
}

const getIcon = (routeName, focused) => {
  const icons = {
    Explore: focused ? "compass" : "compass-outline",
    Tutorials: focused ? "school" : "school-outline",
    Cart: focused ? "cart" : "cart-outline",
    Orders: focused ? "clipboard-list" : "clipboard-list-outline",
    Account: focused ? "account-circle" : "account-circle-outline",
  };

  return icons[routeName] || "circle";
};

export default function AppNavigator() {
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#8a4b2a",
        tabBarInactiveTintColor: "#8b7d72",
        tabBarStyle: { backgroundColor: "#fffaf5", borderTopColor: "#ead7c0", height: 60, paddingBottom: 8 },
        sceneStyle: { backgroundColor: "#f7f2eb" },
        tabBarIcon: ({ color, size, focused }) => (
          <MaterialCommunityIcons
            name={getIcon(route.name, focused)}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Explore" component={ExploreStackNavigator} />
      <Tab.Screen name="Tutorials" component={TutorialsStackNavigator} />
      <Tab.Screen 
        name="Cart" 
        component={CartStackNavigator} 
        options={{ 
          tabBarBadge: itemCount > 0 ? itemCount : null,
          tabBarBadgeStyle: { backgroundColor: "#8a4b2a", color: "#fff" }
        }} 
      />
      <Tab.Screen name="Orders" component={OrdersStackNavigator} />
      <Tab.Screen name="Account" component={AccountStackNavigator} />
    </Tab.Navigator>
  );
}
