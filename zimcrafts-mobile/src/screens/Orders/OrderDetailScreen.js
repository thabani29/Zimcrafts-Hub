import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert, ScrollView } from "react-native";
import { Surface, Text, TextInput } from "react-native-paper";
import * as Linking from "expo-linking";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import { formatCurrency } from "../../utils/formatters";

const formatStatus = (status) => {
  if (!status) return "Pending";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const generateReceiptHtml = (order) => {
  const shipping = order.shippingAddress || {};
  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const shippingCost = order.shippingCost || 0;
  const tax = order.tax || 0;
  const discount = order.discount || 0;
  const total = order.total || 0;

  const sellers = [];
  items.forEach((item) => {
    const seller = item?.seller || item?.product?.seller;
    if (seller && typeof seller === 'object' && seller._id && !sellers.some((s) => s._id === seller._id)) {
      sellers.push(seller);
    }
  });

  const sellerRows = sellers.length
    ? sellers.map((seller) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${seller.name || 'Artisan'}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${seller.Cell || seller.phone || 'Not provided'}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="2" style="padding: 10px; border: 1px solid #e2e8f0;">Seller details unavailable</td>
      </tr>
    `;

  const itemsRows = items
    .map((item, index) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.name || 'Item'}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity || 0}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `)
    .join('');

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Receipt - ${order.orderNumber || ''}</title>
      <style>
        body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #111827; margin: 0; padding: 24px; background: #f8fafc; }
        .receipt-card { max-width: 900px; margin: auto; background: #ffffff; padding: 32px; border-radius: 24px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); }
        .header { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 32px; }
        .brand { font-size: 24px; font-weight: 700; color: #0f172a; }
        .status { font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: #f97316; font-weight: 700; }
        .section { margin-bottom: 32px; }
        .section-title { margin-bottom: 16px; font-size: 16px; font-weight: 700; color: #111827; }
        .grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .box { border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; background: #f8fafc; }
        .field-label { display: block; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; }
        .field-value { font-size: 16px; font-weight: 600; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 14px 12px; border: 1px solid #e2e8f0; }
        th { background: #f1f5f9; text-align: left; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; }
        .text-right { text-align: right; }
        .summary { width: 100%; max-width: 400px; margin-left: auto; margin-top: 24px; }
        .summary-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; }
        .summary-row.total { font-weight: 700; font-size: 17px; border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 16px; }
        .footer { margin-top: 48px; font-size: 13px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div>
            <div class="brand">ZimCrafts Hub</div>
            <div>Professional Receipt</div>
          </div>
          <div class="status">${formatStatus(order.status)}</div>
        </div>
        <div class="section grid">
          <div class="box">
            <div class="field-label">Receipt</div>
            <div class="field-value">${order.orderNumber || 'N/A'}</div>
            <div class="field-label" style="margin-top: 12px;">Date</div>
            <div class="field-value">${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
          </div>
          <div class="box">
            <div class="field-label">Customer</div>
            <div class="field-value">${order.user?.name || shipping.name || 'Guest'}</div>
            <div class="field-label" style="margin-top: 12px;">Phone</div>
            <div class="field-value">${shipping.phone || order.user?.Cell || 'Not provided'}</div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Delivery Address</div>
          <div class="box">
            <div>${shipping.name || ''}</div>
            <div>${shipping.street || ''}</div>
            <div>${shipping.city || ''} ${shipping.state || ''}</div>
            <div>${shipping.country || 'Zimbabwe'} ${shipping.zipCode || ''}</div>
            <div>${shipping.email || ''}</div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Seller details</div>
          <table>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>${sellerRows}</tbody>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Order items</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>${itemsRows}</tbody>
          </table>
        </div>
        <div class="summary">
          <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${formatCurrency(shippingCost)}</span></div>
          <div class="summary-row"><span>Tax</span><span>${formatCurrency(tax)}</span></div>
          ${discount ? `<div class="summary-row"><span>Discount</span><span>-${formatCurrency(discount)}</span></div>` : ''}
          <div class="summary-row total"><span>Total</span><span>${formatCurrency(total)}</span></div>
        </div>
        <div class="footer">Thank you for shopping with ZimCrafts Hub.</div>
      </div>
    </body>
  </html>`;
};

const getUniqueSellers = (items = []) => {
  const seen = new Set();
  return items
    .map((item) => {
      const seller = item?.seller || item?.product?.seller;
      if (!seller) return null;
      const id = typeof seller === "object" ? seller._id : seller;
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return typeof seller === "object" ? seller : { _id: id, name: "Artisan" };
    })
    .filter(Boolean);
};

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await client.getOrderById(orderId);
      setOrder(res?.data?.data || res?.data || res);
    } catch (error) {
      Alert.alert("Error", "Failed to load order details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert("Error", "Please enter the verification code.");
      return;
    }
    try {
      setVerifying(true);
      const res = await client.verifyOrderCode(orderId, verificationCode.trim());
      setOrder(res?.data || res);
      Alert.alert("Success", "Order completed successfully!");
    } catch (error) {
      Alert.alert("Verification Failed", error.message || "Invalid verification code.");
    } finally {
      setVerifying(false);
    }
  };

  const openWhatsApp = (phone, orderNumber) => {
    if (!phone) return;
    const sanitized = String(phone).replace(/[^\d]/g, "");
    const message = `Hello, I have a question about my order ${orderNumber}.`;
    Linking.openURL(`whatsapp://send?phone=${sanitized}&text=${encodeURIComponent(message)}`);
  };

  const openEmail = (email, orderNumber) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}?subject=Inquiry about order ${orderNumber}`);
  };

  const openPhone = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const downloadReceipt = async () => {
    try {
      const html = generateReceiptHtml(order);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Could not generate or share receipt.");
    }
  };

  if (loading || !order) return <LoadingState label="Loading order details..." />;

  const sellers = getUniqueSellers(order.items);

  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleLarge" style={styles.title}>
            Order {order.orderNumber}
          </Text>
          <Text variant="bodyMedium">Status: {order.status}</Text>
          <Text variant="bodyMedium">Total: {formatCurrency(order.total)}</Text>
        </Surface>

        {order.status === "awaiting_confirmation" && (
          <Surface style={[styles.card, { backgroundColor: "#e8f4fd", borderColor: "#b6dbf6", borderWidth: 1 }]} elevation={0}>
            <Text variant="titleMedium" style={{ color: "#0d47a1", fontWeight: "bold" }}>
              Complete Your Order
            </Text>
            <Text variant="bodySmall" style={{ marginBottom: 12, color: "#1565c0" }}>
              Your seller has marked this order as complete. Please enter the verification code sent to your email to confirm delivery.
            </Text>
            <AppTextField
              label="6-Digit Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <AppButton loading={verifying} disabled={verifying} onPress={handleVerifyCode} style={{ marginTop: 8 }}>
              Verify & Complete Order
            </AppButton>
          </Surface>
        )}

        {sellers.length > 0 && (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.title}>Contact Artisan</Text>
            {sellers.map((seller) => (
              <View key={seller._id} style={styles.sellerBlock}>
                <Text variant="bodyLarge" style={{ fontWeight: "bold", marginBottom: 8 }}>
                  {seller.name || "Artisan"}
                </Text>
                <View style={styles.contactRow}>
                  {seller.Cell || seller.phone ? (
                    <>
                      <AppButton mode="outlined" onPress={() => openWhatsApp(seller.Cell || seller.phone, order.orderNumber)} style={{ flex: 1, marginRight: 4 }}>
                        WhatsApp
                      </AppButton>
                      <AppButton mode="outlined" onPress={() => openPhone(seller.Cell || seller.phone)} style={{ flex: 1, marginLeft: 4 }}>
                        Call
                      </AppButton>
                    </>
                  ) : null}
                </View>
                {seller.email && (
                  <AppButton mode="text" onPress={() => openEmail(seller.email, order.orderNumber)}>
                    Email Artisan
                  </AppButton>
                )}
              </View>
            ))}
          </Surface>
        )}

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.title}>Items</Text>
          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text variant="bodyMedium" style={{ flex: 1 }}>{item.name}</Text>
              <Text variant="bodyMedium">x{item.quantity}</Text>
              <Text variant="bodyMedium" style={{ marginLeft: 16 }}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}
        </Surface>

        <AppButton mode="outlined" onPress={downloadReceipt} style={{ marginTop: 16 }}>
          Download Receipt
        </AppButton>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    marginBottom: 16,
    gap: 8,
  },
  title: {
    color: "#432818",
    fontWeight: "800",
  },
  sellerBlock: {
    backgroundColor: "#f7f2eb",
    padding: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e6db",
  },
});
