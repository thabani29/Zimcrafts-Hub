import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import client from "../../api/client";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ProductCard from "../../components/ProductCard";
import ScreenShell from "../../components/ScreenShell";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    categories: [],
    products: [],
    error: "",
  });

  useEffect(() => {
    loadHome();
  }, []);

  const loadHome = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const [categoriesResponse, productsResponse] = await Promise.all([
        client.getCategories(),
        client.getProducts({ limit: 6 }),
      ]);

      setState({
        loading: false,
        refreshing: false,
        categories: categoriesResponse.data || [],
        products: productsResponse.data || [],
        error: "",
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error.message,
      }));
    }
  };

  if (state.loading) {
    return <LoadingState label="Curating craft collections..." />;
  }

  return (
    <ScreenShell refreshing={state.refreshing} onRefresh={() => loadHome(true)}>
      <Surface style={styles.hero} elevation={1}>
        <Text variant="headlineSmall" style={styles.heroTitle}>
          Hello, {user?.name?.split(" ")[0] || "creator"}
        </Text>
        <Text variant="bodyLarge" style={styles.heroText}>
          Discover Zimbabwean handmade products and artisan-led learning from one place.
        </Text>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Categories
        </Text>
        <View style={styles.categoryWrap}>
          {state.categories.slice(0, 6).map((category) => (
            <Surface key={category._id} style={styles.categoryChip} elevation={0}>
              <Text 
                variant="labelLarge" 
                style={styles.categoryText}
                onPress={() => navigation.navigate("ProductList", {
                  category: category._id, categoryName: category.name
                })}
              >
                {category.name}
              </Text>
            </Surface>
          ))}
        </View>
      </Surface>

      <View style={styles.headerRow}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Fresh finds
        </Text>
        <Text variant="bodyMedium" style={styles.link} onPress={() => navigation.navigate("ProductList")}>
          See all
        </Text>
      </View>

      {state.products.length ? (
        state.products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onPress={() =>
              navigation.navigate("ProductDetail", {
                productId: product._id, productName: product.name
              })
            }
          />
        ))
      ) : (
        <EmptyState title="No products available yet" subtitle={state.error || "Try refreshing in a moment."} />
      )}

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account
        </Text>
        <Text variant="bodyMedium" style={styles.accountText}>
          Signed in as {user?.email}
        </Text>
        <Text variant="bodyMedium" style={styles.link} onPress={logout}>
          Sign out
        </Text>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: "#4a2d1f",
    gap: 10,
  },
  heroTitle: {
    color: "#fff7ee",
    fontWeight: "900",
  },
  heroText: {
    color: "#ead7c0",
  },
  section: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#fffdf9",
    gap: 12,
  },
  sectionTitle: {
    color: "#432818",
    fontWeight: "800",
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1e5d5",
  },
  categoryText: {
    color: "#5e4735",
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: {
    color: "#8a4b2a",
    fontWeight: "700",
  },
  accountText: {
    color: "#6b4f3a",
  },
});
