import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, ScrollView, View, Image, TouchableOpacity } from "react-native";
import { Surface, Text, IconButton, Checkbox } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import CategoryPicker from "../../components/CategoryPicker";
import ScreenShell from "../../components/ScreenShell";

export default function UploadProductScreen({ route, navigation }) {
  const productId = route.params?.productId;
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    subcategory: "",
    tags: "",
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    if (productId) {
      loadProduct();
    } else {
      setLoading(false);
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await client.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await client.getProductById(productId);
      
      // The API returns { product, relatedProducts } inside the data wrapper
      const prod = response?.product || response?.data || response;
      
      if (!prod || typeof prod !== "object") {
        throw new Error("Could not find product details in the server response.");
      }

      setFormData({
        name: prod.name || "",
        description: prod.description || "",
        price: prod.price !== undefined ? String(prod.price) : "",
        stock: prod.stock !== undefined ? String(prod.stock) : "",
        category: prod.category?._id || prod.category || "",
        subcategory: prod.subcategory || "",
        tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : prod.tags || "",
        isFeatured: !!prod.isFeatured,
        isNewArrival: !!prod.isNewArrival,
        isBestSeller: !!prod.isBestSeller,
      });
      setExistingImages(prod.productimages || prod.images || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load product details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need access to your photos to upload product images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - existingImages.length - images.length,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      Alert.alert("Error", "Please fill in all required fields (Name, Price, Stock, Category).");
      return;
    }

    if (images.length === 0 && existingImages.length === 0) {
      Alert.alert("Error", "At least one product image is required.");
      return;
    }

    try {
      setSubmitting(true);
      const tagsArray = formData.tags
        ? formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
        : [];

      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("stock", formData.stock);
      data.append("category", formData.category);
      data.append("subcategory", formData.subcategory);
      data.append("tags", JSON.stringify(tagsArray));
      data.append("isFeatured", String(formData.isFeatured));
      data.append("isNewArrival", String(formData.isNewArrival));
      data.append("isBestSeller", String(formData.isBestSeller));

      if (productId) {
        data.append("productimages", JSON.stringify(existingImages));
      }

      // Append images
      images.forEach((img, index) => {
        const uri = img.uri;
        const name = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(name);
        const type = match ? `image/${match[1]}` : `image`;
        data.append("images", { uri, name, type });
      });

      if (productId) {
        await client.updateProduct(productId, data);
        Alert.alert("Success", "Product updated successfully!", [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        await client.createProduct(data);
        Alert.alert("Success", "Product uploaded successfully!", [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert("Upload failed", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFlag = (flag) => {
    setFormData({ ...formData, [flag]: !formData[flag] });
  };

  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <Text variant="bodyLarge" style={{ textAlign: "center", marginTop: 20 }}>Loading...</Text>
        ) : (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleLarge" style={styles.title}>
              {productId ? "Edit Product" : "New Product"}
            </Text>
            
            <AppTextField
              label="Product Name *"
              value={formData.name}
              onChangeText={(v) => setFormData({ ...formData, name: v })}
            />
            
            <AppTextField
              label="Description *"
              value={formData.description}
              onChangeText={(v) => setFormData({ ...formData, description: v })}
              multiline
              numberOfLines={4}
            />

            <View style={styles.row}>
              <AppTextField
                label="Price ($) *"
                value={formData.price}
                onChangeText={(v) => setFormData({ ...formData, price: v })}
                keyboardType="numeric"
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <AppTextField
                label="Stock *"
                value={formData.stock}
                onChangeText={(v) => setFormData({ ...formData, stock: v })}
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
              />
            </View>

            <CategoryPicker
              categories={categories}
              selectedId={formData.category}
              onSelect={(id) => setFormData({ ...formData, category: id })}
            />
            
            <AppTextField
              label="Subcategory"
              value={formData.subcategory}
              onChangeText={(v) => setFormData({ ...formData, subcategory: v })}
            />

            <AppTextField
              label="Tags (comma separated)"
              value={formData.tags}
              onChangeText={(v) => setFormData({ ...formData, tags: v })}
              placeholder="handmade, ceramic..."
            />

            <View style={styles.flags}>
              <TouchableOpacity style={styles.flagItem} onPress={() => toggleFlag("isFeatured")}>
                <Checkbox status={formData.isFeatured ? "checked" : "unchecked"} />
                <Text>Featured</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.flagItem} onPress={() => toggleFlag("isNewArrival")}>
                <Checkbox status={formData.isNewArrival ? "checked" : "unchecked"} />
                <Text>New Arrival</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.flagItem} onPress={() => toggleFlag("isBestSeller")}>
                <Checkbox status={formData.isBestSeller ? "checked" : "unchecked"} />
                <Text>Best Seller</Text>
              </TouchableOpacity>
            </View>

            <Text variant="titleMedium" style={styles.sectionTitle}>Images</Text>
            
            <View style={styles.imageGrid}>
              {existingImages.map((img, index) => (
                <View key={`existing-${index}`} style={styles.imageWrapper}>
                  <Image source={{ uri: img.url || img }} style={styles.thumbnail} />
                  <IconButton
                    icon="close-circle"
                    size={20}
                    iconColor="red"
                    style={styles.removeIcon}
                    onPress={() => removeExistingImage(index)}
                  />
                </View>
              ))}
              {images.map((img, index) => (
                <View key={`new-${index}`} style={styles.imageWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                  <IconButton
                    icon="close-circle"
                    size={20}
                    iconColor="red"
                    style={styles.removeIcon}
                    onPress={() => removeImage(index)}
                  />
                </View>
              ))}
              {existingImages.length + images.length < 5 && (
                <TouchableOpacity style={styles.addImages} onPress={pickImages}>
                  <IconButton icon="camera-plus" size={30} />
                  <Text variant="labelSmall">Add Image</Text>
                </TouchableOpacity>
              )}
            </View>

            <AppButton loading={submitting} disabled={submitting} onPress={handleSubmit} style={{ marginTop: 12 }}>
              {productId ? "Save Changes" : "Upload Product"}
            </AppButton>
          </Surface>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    gap: 12,
  },
  title: {
    color: "#432818",
    fontWeight: "800",
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 12,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  flags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  flagItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  imageWrapper: {
    position: "relative",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  removeIcon: {
    position: "absolute",
    top: -10,
    right: -10,
    margin: 0,
  },
  addImages: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
});
