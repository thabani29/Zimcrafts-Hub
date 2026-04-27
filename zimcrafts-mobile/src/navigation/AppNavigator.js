import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ProductsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#f7f2eb" },
        headerShadowVisible: false,
        headerTintColor: "#432818",
        contentStyle: { backgroundColor: "#f7f2eb" },
      }}
    >
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: "Products" }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product details" }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
    </Stack.Navigator>
  );
}

function TutorialsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#f7f2eb" },
        headerShadowVisible: false,
        headerTintColor: "#432818",
        contentStyle: { backgroundColor: "#f7f2eb" },
      }}
    >
      <Stack.Screen name="TutorialList" component={TutorialsScreen} options={{ title: "Tutorials" }} />
      <Stack.Screen name="TutorialDetail" component={TutorialDetailScreen} options={{ title: "Tutorial details" }} />
      <Stack.Screen name="TutorialRequests" component={TutorialRequestsScreen} options={{ title: "Tutorial requests" }} />
    </Stack.Navigator>
  );
}

const getIcon = (routeName, focused) => {
  const icons = {
    Home: focused ? "home" : "home-outline",
    Dashboard: focused ? "view-dashboard" : "view-dashboard-outline",
    Products: focused ? "shopping" : "shopping-outline",
    Orders: focused ? "clipboard-list" : "clipboard-list-outline",
    Wallet: focused ? "wallet" : "wallet-outline",
    Tutorials: focused ? "school" : "school-outline",
  };

  return icons[routeName] || "circle";
};

export default function AppNavigator() {
  const { isArtisan } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#f7f2eb" },
        headerShadowVisible: false,
        headerTintColor: "#432818",
        tabBarActiveTintColor: "#8a4b2a",
        tabBarInactiveTintColor: "#8b7d72",
        tabBarStyle: { backgroundColor: "#fffaf5", borderTopColor: "#ead7c0" },
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
      {isArtisan ? (
        <>
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Orders" component={SellerOrdersScreen} />
          <Tab.Screen name="Wallet" component={WalletScreen} />
          <Tab.Screen
            name="Tutorials"
            component={TutorialsStackNavigator}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen
            name="Products"
            component={ProductsStackNavigator}
            options={{ headerShown: false }}
          />
          <Tab.Screen name="Orders" component={OrdersScreen} />
          <Tab.Screen
            name="Tutorials"
            component={TutorialsStackNavigator}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}
