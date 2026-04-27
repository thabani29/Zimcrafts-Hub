import React, { useEffect, useState } from "react";
import { Surface, Text } from "react-native-paper";
import client from "../../api/client";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ProductCard from "../../components/ProductCard";
import ScreenShell from "../../components/ScreenShell";

export default function ProductListScreen({ navigation }) {
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    products: [],
    error: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const response = await client.getProducts({ limit: 20 });
      setState({
        loading: false,
        refreshing: false,
        products: response.data || [],
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
    return <LoadingState label="Loading products..." />;
  }

  return (
    <ScreenShell refreshing={state.refreshing} onRefresh={() => loadProducts(true)}>
      <Surface style={{ padding: 18, borderRadius: 22, backgroundColor: "#fffdf9" }} elevation={1}>
        <Text variant="titleLarge" style={{ color: "#432818", fontWeight: "800" }}>
          Handmade marketplace
        </Text>
        <Text variant="bodyMedium" style={{ color: "#6b4f3a" }}>
          Browse active products from artisans across the platform.
        </Text>
      </Surface>
      {state.products.length ? (
        state.products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onPress={() =>
              navigation.navigate("ProductDetail", {
                productId: product._id,
                productName: product.name,
              })
            }
          />
        ))
      ) : (
        <EmptyState title="No products are live yet" subtitle={state.error || "Pull to refresh once new listings are added."} />
      )}
    </ScreenShell>
  );
}
