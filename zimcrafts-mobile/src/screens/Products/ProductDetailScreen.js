import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Divider, Surface, Text } from "react-native-paper";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency, getProductImage } from "../../utils/formatters";

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const { isCustomer } = useAuth();
  const { addToCart } = useCart();
  const [state, setState] = useState({ loading: true, product: null, relatedProducts: [], error: "" });

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setState({ loading: true, product: null, relatedProducts: [], error: "" });
      const response = await client.getProductById(productId);
      setState({
        loading: false,
        product: response.data?.product || null,
        relatedProducts: response.data?.relatedProducts || [],
        error: "",
      });
    } catch (error) {
      setState({ loading: false, product: null, relatedProducts: [], error: error.message });
    }
  };

  if (state.loading) {
    return <LoadingState label="Loading product details..." />;
  }

  const product = state.product;
  if (!product) {
    return (
      <ScreenShell>
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium">Product unavailable</Text>
          <Text variant="bodyMedium">{state.error || "This product could not be found."}</Text>
        </Surface>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <Image source={{ uri: getProductImage(product) }} style={styles.image} />
      <Surface style={styles.card} elevation={1}>
        <Text variant="headlineSmall" style={styles.title}>
          {product.name}
        </Text>
        <Text variant="titleLarge" style={styles.price}>
          {formatCurrency(product.price)}
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          {product.description}
        </Text>
        <Divider />
        <View style={styles.metaRow}>
          <Text variant="bodyMedium">Category</Text>
          <Text variant="bodyMedium">{product.category?.name || "Uncategorized"}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text variant="bodyMedium">Artisan</Text>
          <Text variant="bodyMedium">{product.artisan?.name || "Unknown"}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text variant="bodyMedium">Stock</Text>
          <Text variant="bodyMedium">{product.stock ?? 0}</Text>
        </View>
        {isCustomer ? (
          <>
            <AppButton
              onPress={() => {
                addToCart(product);
                navigation.navigate("Checkout");
              }}
            >
              Buy now
            </AppButton>
            <AppButton mode="outlined" onPress={() => addToCart(product)}>
              Add to cart
            </AppButton>
          </>
        ) : (
          <Text variant="bodyMedium" style={styles.note}>
            Customer checkout is hidden for artisan accounts.
          </Text>
        )}
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 280,
    borderRadius: 24,
    backgroundColor: "#ead7c0",
  },
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    gap: 12,
  },
  title: {
    color: "#432818",
    fontWeight: "800",
  },
  price: {
    color: "#8a4b2a",
    fontWeight: "900",
  },
  description: {
    color: "#6b4f3a",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  note: {
    color: "#7c5d48",
  },
});
