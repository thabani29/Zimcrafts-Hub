import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Divider, Surface, Text, Avatar, TextInput, IconButton } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency, getProductImage } from "../../utils/formatters";

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const { isCustomer, user } = useAuth();
  const { addToCart } = useCart();
  
  const [state, setState] = useState({ 
    loading: true, 
    product: null, 
    relatedProducts: [], 
    error: "" 
  });

  const [review, setReview] = useState({
    rating: 5,
    title: "",
    comment: "",
    submitting: false,
    message: ""
  });

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

  const handleReviewSubmit = async () => {
    if (!review.comment.trim()) {
      return Alert.alert("Error", "Please enter a comment for your review.");
    }

    try {
      setReview(prev => ({ ...prev, submitting: true, message: "" }));
      await client.addProductReview(productId, {
        rating: review.rating,
        title: review.title,
        comment: review.comment.trim()
      });
      
      Alert.alert("Success", "Thank you! Your review has been posted.");
      setReview({
        rating: 5,
        title: "",
        comment: "",
        submitting: false,
        message: ""
      });
      loadProduct(); // Reload to show new review
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit review.");
      setReview(prev => ({ ...prev, submitting: false }));
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

  const averageRating = product.ratings?.average || 0;
  const reviewCount = product.reviews?.length || 0;

  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: getProductImage(product) }} style={styles.image} />
        
        <Surface style={styles.card} elevation={1}>
          <View style={styles.headerRow}>
            <Text variant="headlineSmall" style={styles.title}>{product.name}</Text>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={16} color="#fff" />
              <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
            </View>
          </View>

          <Text variant="titleLarge" style={styles.price}>{formatCurrency(product.price)}</Text>
          
          <Text variant="bodyMedium" style={styles.description}>{product.description}</Text>
          
          <Divider />
          
          <View style={styles.metaRow}>
            <Text variant="bodyMedium" style={styles.metaLabel}>Category</Text>
            <Text variant="bodyMedium" style={styles.metaValue}>{product.category?.name || "Uncategorized"}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text variant="bodyMedium" style={styles.metaLabel}>Artisan</Text>
            <Text variant="bodyMedium" style={styles.metaValue}>{product.artisan?.name || "Unknown"}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text variant="bodyMedium" style={styles.metaLabel}>Stock</Text>
            <Text variant="bodyMedium" style={styles.metaValue}>{product.stock ?? 0} available</Text>
          </View>

          {isCustomer ? (
            <View style={styles.actionButtons}>
              <AppButton
                onPress={() => {
                  addToCart(product);
                  navigation.navigate("Cart");
                }}
                style={styles.buyBtn}
              >
                Buy Now
              </AppButton>
              <AppButton mode="outlined" onPress={() => addToCart(product)} style={styles.cartBtn}>
                Add to Cart
              </AppButton>
            </View>
          ) : (
            <Text variant="bodyMedium" style={styles.note}>
              Customer checkout is hidden for artisan accounts.
            </Text>
          )}
        </Surface>

        {/* Reviews Section */}
        <Surface style={[styles.card, styles.reviewSection]} elevation={1}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Customer Reviews</Text>
          <Text variant="bodySmall" style={styles.reviewStats}>
            {reviewCount} review{reviewCount !== 1 ? 's' : ''} • {averageRating.toFixed(1)} / 5 average
          </Text>
          
          <Divider style={styles.sectionDivider} />

          {product.reviews?.length > 0 ? (
            product.reviews.map((rev) => (
              <View key={rev._id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Avatar.Text 
                    size={32} 
                    label={rev.user?.name?.substring(0, 1) || "C"} 
                    style={styles.reviewAvatar} 
                  />
                  <View style={styles.reviewInfo}>
                    <Text variant="titleSmall" style={styles.reviewerName}>{rev.user?.name || "Customer"}</Text>
                    <Text variant="labelSmall" style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.itemRating}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <MaterialCommunityIcons 
                        key={s} 
                        name={s <= rev.rating ? "star" : "star-outline"} 
                        size={14} 
                        color="#ed6c02" 
                      />
                    ))}
                  </View>
                </View>
                {rev.title ? <Text variant="titleSmall" style={styles.reviewTitle}>{rev.title}</Text> : null}
                <Text variant="bodyMedium" style={styles.reviewComment}>{rev.comment}</Text>
              </View>
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyReviews}>No reviews yet. Be the first to share your thoughts!</Text>
          )}
        </Surface>

        {/* Leave a Review Section */}
        {isCustomer && (
          <Surface style={[styles.card, styles.addReviewSection]} elevation={1}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Leave a Review</Text>
            
            <View style={styles.starRatingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReview(prev => ({ ...prev, rating: star }))}>
                  <MaterialCommunityIcons 
                    name={star <= review.rating ? "star" : "star-outline"} 
                    size={36} 
                    color="#ed6c02" 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              label="Review Title (Optional)"
              value={review.title}
              onChangeText={text => setReview(prev => ({ ...prev, title: text }))}
              mode="outlined"
              outlineColor="#ead7c0"
              activeOutlineColor="#8a4b2a"
              style={styles.input}
            />

            <TextInput
              label="Your Comment"
              value={review.comment}
              onChangeText={text => setReview(prev => ({ ...prev, comment: text }))}
              mode="outlined"
              multiline
              numberOfLines={4}
              outlineColor="#ead7c0"
              activeOutlineColor="#8a4b2a"
              style={[styles.input, styles.textArea]}
            />

            <AppButton 
              onPress={handleReviewSubmit} 
              loading={review.submitting}
              disabled={review.submitting}
              style={styles.submitReviewBtn}
            >
              Submit Review
            </AppButton>
          </Surface>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 320,
    borderRadius: 24,
    backgroundColor: "#ead7c0",
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: "#fffdf9",
    gap: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    color: "#432818",
    fontWeight: "900",
    flex: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8a4b2a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  price: {
    color: "#8a4b2a",
    fontWeight: "900",
  },
  description: {
    color: "#6b4f3a",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    color: "#7c5d48",
    fontWeight: "600",
  },
  metaValue: {
    color: "#432818",
    fontWeight: "bold",
  },
  actionButtons: {
    marginTop: 8,
    gap: 10,
  },
  buyBtn: {
    borderRadius: 14,
  },
  cartBtn: {
    borderRadius: 14,
    borderColor: "#8a4b2a",
  },
  note: {
    color: "#7c5d48",
    fontStyle: "italic",
    textAlign: "center",
    backgroundColor: "rgba(138, 75, 42, 0.05)",
    padding: 12,
    borderRadius: 12,
  },
  reviewSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    color: "#432818",
    fontWeight: "900",
  },
  reviewStats: {
    color: "#7c5d48",
    marginBottom: 8,
  },
  sectionDivider: {
    backgroundColor: "#ead7c0",
    marginVertical: 4,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e6db",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  reviewAvatar: {
    backgroundColor: "#ead7c0",
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    color: "#432818",
    fontWeight: "bold",
  },
  reviewDate: {
    color: "#7c5d48",
  },
  itemRating: {
    flexDirection: "row",
  },
  reviewTitle: {
    color: "#432818",
    fontWeight: "bold",
    marginBottom: 4,
  },
  reviewComment: {
    color: "#6b4f3a",
    lineHeight: 20,
  },
  emptyReviews: {
    color: "#7c5d48",
    textAlign: "center",
    paddingVertical: 20,
  },
  addReviewSection: {
    paddingTop: 24,
  },
  starRatingRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 12,
  },
  input: {
    backgroundColor: "#fff",
  },
  textArea: {
    textAlignVertical: "top",
  },
  submitReviewBtn: {
    marginTop: 8,
    borderRadius: 14,
  },
});
