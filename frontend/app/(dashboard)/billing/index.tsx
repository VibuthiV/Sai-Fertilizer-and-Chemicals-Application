// app/(dashboard)/billing/index.tsx — Billing Screen

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, Pressable, ScrollView, TextInput as RNTextInput } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

import {
  Text,
  FAB,
  Searchbar,
  Card,
  Dialog,
  Portal,
  TextInput,
  Button,
  IconButton,
  SegmentedButtons,
  ActivityIndicator,
  Divider,
  Chip,
} from 'react-native-paper';
import { COLORS } from '@/constants/colors';
import { billService } from '@/services/billService';
import { productService } from '@/services/productService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Bill, CreateBillItemDto } from '@/types/bill.types';
import { Product } from '@/types/product.types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface BasketItem {
  productId: number;
  name: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  currentStock: number;
}

export default function BillingScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Bill wizard state
  const [newBillVisible, setNewBillVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Products, 2: Customer Details, 3: Confirm
  const [productList, setProductList] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [basket, setBasket] = useState<Record<number, BasketItem>>({});

  // Customer Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAadhar, setCustomerAadhar] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'credit'>('cash');
  const [notes, setNotes] = useState('');
  const [savingBill, setSavingBill] = useState(false);

  // Details dialog state
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [printingPdf, setPrintingPdf] = useState(false);

  const fetchBills = async (search = searchQuery) => {
    try {
      setLoading(true);
      const res = await billService.getAll({
        search: search || undefined,
        page: 1,
        limit: 100,
      });
      setBills(res.data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      Alert.alert('Error', 'Failed to retrieve bills');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProductsForBilling = async (search = productSearch) => {
    try {
      const res = await productService.getAll({
        search: search || undefined,
        page: 1,
        limit: 100,
      });
      setProductList(res.data || []);
    } catch (error) {
      console.error('Error fetching products for billing:', error);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    fetchBills(query);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBills(searchQuery);
  };

  const openNewBillWizard = async () => {
    setBasket({});
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAadhar('');
    setDiscountAmount('0');
    setPaymentMethod('cash');
    setNotes('');
    setWizardStep(1);
    setProductSearch('');
    await fetchProductsForBilling('');
    setNewBillVisible(true);
  };

  const handleProductSearch = (query: string) => {
    setProductSearch(query);
    fetchProductsForBilling(query);
  };

  const toggleBasketItem = (product: Product) => {
    setBasket((prev) => {
      const copy = { ...prev };
      if (copy[product.id]) {
        delete copy[product.id];
      } else {
        copy[product.id] = {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unit: product.unit,
          sellingPrice: product.sellingPrice,
          currentStock: product.currentStock,
        };
      }
      return copy;
    });
  };

  const adjustBasketItemQty = (productId: number, change: number) => {
    setBasket((prev) => {
      const copy = { ...prev };
      const item = copy[productId];
      if (!item) return prev;

      const newQty = item.quantity + change;
      if (newQty <= 0) {
        delete copy[productId];
      } else if (newQty > item.currentStock) {
        Alert.alert('Stock Limit Exceeded', `Only ${item.currentStock} ${item.unit}(s) available in stock.`);
      } else {
        copy[productId] = { ...item, quantity: newQty };
      }
      return copy;
    });
  };

  const handleQuantityTextChange = (productId: number, text: string) => {
    const qty = parseFloat(text);
    setBasket((prev) => {
      const copy = { ...prev };
      const item = copy[productId];
      if (!item) return prev;

      if (isNaN(qty) || qty <= 0) {
        // Allow temporary typing / clear
        copy[productId] = { ...item, quantity: 0 };
      } else if (qty > item.currentStock) {
        Alert.alert('Stock Limit Exceeded', `Only ${item.currentStock} ${item.unit}(s) available in stock.`);
        copy[productId] = { ...item, quantity: item.currentStock };
      } else {
        copy[productId] = { ...item, quantity: qty };
      }
      return copy;
    });
  };

  const calculateSubtotal = () => {
    return Object.values(basket).reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(discountAmount) || 0;
    return Math.max(0, subtotal - discount);
  };

  const handleNextStep = () => {
    if (wizardStep === 1) {
      const items = Object.values(basket).filter((item) => item.quantity > 0);
      if (items.length === 0) {
        Alert.alert('Selection Required', 'Please select at least one product with quantity > 0.');
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!customerName.trim()) {
        Alert.alert('Validation Error', 'Customer Name is required');
        return;
      }
      if (!customerPhone.trim()) {
        Alert.alert('Validation Error', 'Customer Mobile Number is required');
        return;
      }
      if (customerPhone.trim().length < 10) {
        Alert.alert('Validation Error', 'Invalid Mobile Number (must be at least 10 digits)');
        return;
      }
      if (!customerAadhar.trim()) {
        Alert.alert('Validation Error', 'Customer Aadhar Number is required');
        return;
      }
      if (customerAadhar.trim().replace(/\s/g, '').length !== 12) {
        Alert.alert('Validation Error', 'Aadhar Number must be exactly 12 digits');
        return;
      }
      setWizardStep(3);
    }
  };

  const handleCreateBill = async () => {
    setSavingBill(true);
    const itemsDto: CreateBillItemDto[] = Object.values(basket)
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit: item.sellingPrice,
        discount: 0,
      }));

    const billPayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAadhar: customerAadhar.trim().replace(/\s/g, ''),
      items: itemsDto,
      discountAmount: parseFloat(discountAmount) || 0,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    try {
      await billService.create(billPayload);
      Alert.alert('Success', 'Bill generated successfully');
      setNewBillVisible(false);
      fetchBills();
    } catch (error: any) {
      console.error('Error generating bill:', error);
      const msg = error?.response?.data?.message || 'Failed to generate bill';
      Alert.alert('Error', msg);
    } finally {
      setSavingBill(false);
    }
  };

  const openBillDetails = (bill: Bill) => {
    setSelectedBill(bill);
    setDetailsVisible(true);
  };

  const generatePdfInvoice = async (bill: Bill) => {
    try {
      setPrintingPdf(true);
      const shopName = user?.shopName || 'Sai Fertilizers & Chemicals';
      const contactPhone = user?.contactPhone || '+91 98765 43210';
      const address = user?.address || 'NH Road, Shop No. 12, Main Market';
      const gstin = user?.gstin || '33AAAAA1111A1Z1';
      const adminName = user?.adminName || 'Admin User';

      const dateFormatted = new Date(bill.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Prepare HTML content for a highly professional bill
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Invoice - ${shopName}</title>
          <style>
            body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 14px; line-height: 24px; color: #555; background-color: #fff; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .header-logo { font-size: 26px; font-weight: bold; color: #1B5E20; text-transform: uppercase; margin: 0; }
            .header-subtitle { font-size: 11px; color: #666; margin: 2px 0 0 0; font-style: italic; }
            .meta-info { text-align: right; font-size: 12px; }
            .meta-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
            
            .divider { border-bottom: 2px solid #1B5E20; margin: 15px 0; }
            
            .client-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .client-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #1B5E20; margin-bottom: 6px; }
            .client-details { font-size: 13px; line-height: 1.5; }
            
            .items-table { width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 30px; }
            .items-table th { background-color: #1B5E20; color: white; padding: 10px; font-size: 12px; text-transform: uppercase; }
            .items-table td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
            .items-table tr.last td { border-bottom: none; }
            
            .totals-table { width: 35%; float: right; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
            .totals-table td { padding: 8px 10px; }
            .totals-table tr.grand-total { font-size: 16px; font-weight: bold; background-color: #E8F5E9; color: #1B5E20; border-top: 2px solid #1B5E20; }
            
            .footer { clear: both; margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px dashed #ddd; padding-top: 15px; }
            .footer-bold { font-weight: bold; color: #555; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <!-- Top Header -->
            <table class="header-table">
              <tr>
                <td>
                  <h1 class="header-logo">${shopName}</h1>
                  <p class="header-subtitle">Quality Fertilizers, Seeds, Pesticides & Farm Equipments</p>
                  <p style="font-size: 12px; margin: 5px 0 0 0; color: #444;">
                    ${address}<br>
                    GSTIN: ${gstin} | Mobile: ${contactPhone}
                  </p>
                </td>
                <td class="meta-info">
                  <div class="meta-title">TAX INVOICE</div>
                  <b>Invoice No:</b> ${bill.billNumber}<br>
                  <b>Date:</b> ${dateFormatted}<br>
                  <b>Payment Mode:</b> ${bill.paymentMethod.toUpperCase()}<br>
                  <b>Status:</b> ${bill.paymentStatus.toUpperCase()}
                </td>
              </tr>
            </table>

            <div class="divider"></div>

            <!-- Client & Shipping Details -->
            <table class="client-table">
              <tr>
                <td style="width: 50%;">
                  <div class="client-title">Billed To (Customer):</div>
                  <div class="client-details">
                    <strong>${bill.customerName}</strong><br>
                    Mobile: +91 ${bill.customerPhone}<br>
                    Aadhar ID: ${bill.customerAadhar ? bill.customerAadhar.replace(/(\d{4})/g, '$1 ').trim() : 'N/A'}
                  </div>
                </td>
                <td style="width: 50%; text-align: right; vertical-align: top;">
                  <div class="client-title">Store Operations:</div>
                  <div class="client-details">
                    Authorized Signatory: ${adminName}<br>
                    ${shopName}<br>
                    State: Tamil Nadu, Code: 33
                  </div>
                </td>
              </tr>
            </table>

            <!-- Purchase Grid -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">S.No</th>
                  <th style="width: 45%;">Item / Product Description</th>
                  <th style="width: 15%; text-align: center;">Rate (₹)</th>
                  <th style="width: 15%; text-align: center;">Quantity</th>
                  <th style="width: 20%; text-align: right;">Total Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${bill.items
                  .map(
                    (item, idx) => `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>${item.productName}</strong></td>
                    <td style="text-align: center;">${parseFloat(item.pricePerUnit.toString()).toFixed(2)}</td>
                    <td style="text-align: center;">${item.quantity} ${item.unit}(s)</td>
                    <td style="text-align: right;">${parseFloat(item.totalPrice.toString()).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <!-- Totals Section -->
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹${parseFloat(bill.subtotal.toString()).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Discount:</td>
                <td style="text-align: right; color: #C62828;">- ₹${parseFloat(bill.discountAmount.toString()).toFixed(2)}</td>
              </tr>
              <tr class="grand-total">
                <td>Grand Total:</td>
                <td style="text-align: right;">₹${parseFloat(bill.totalAmount.toString()).toFixed(2)}</td>
              </tr>
            </table>

            <!-- Terms & Footer -->
            <div class="footer">
              <span class="footer-bold">Terms & Conditions:</span><br>
              1. Goods once sold will not be accepted back or exchanged.<br>
              2. Keep chemical bags and pesticide bottles in a cool, dry place away from children.<br>
              3. Check product packaging seals before open and usage.<br>
              <br>
              <strong style="color: #1B5E20; font-size: 12px;">🌱 Thank you for choosing ${shopName}! 🌱</strong>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice_${bill.billNumber}` });
    } catch (err: any) {
      console.error('PDF Invoice Generation failed:', err);
      Alert.alert('PDF Error', 'Could not generate and share invoice PDF file: ' + err.message);
    } finally {
      setPrintingPdf(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <View style={styles.container}>
      {/* Search Bills */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search bills by number or customer..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Bills FlatList */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching billing records...</Text>
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="receipt-text-minus-outline" size={48} color={COLORS.textDisabled} />
              </View>
              <Text variant="titleMedium" style={styles.emptyTitle}>No Invoices Found</Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Tap the + button to generate a new customer invoice!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.billCard} onPress={() => openBillDetails(item)}>
              <Card.Content style={styles.billContent}>
                <View style={styles.billHeaderRow}>
                  <View style={styles.billNumWrapper}>
                    <MaterialCommunityIcons name="file-document-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.billNumberText}>{item.billNumber}</Text>
                  </View>
                  <Text style={styles.billDateText}>{formatDate(item.createdAt)}</Text>
                </View>
                
                <Divider style={styles.billDivider} />
                
                <View style={styles.billMainRow}>
                  <View>
                    <Text style={styles.custNameText}>{item.customerName}</Text>
                    <Text style={styles.custPhoneText}>
                      +91 {item.customerPhone ? item.customerPhone.replace(/(\d{5})(\d{5})/, '$1-$2') : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.amountSection}>
                    <Text style={styles.billAmtText}>{formatCurrency(item.totalAmount)}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.paymentStatus === 'paid'
                              ? `${COLORS.success}12`
                              : `${COLORS.secondary}12`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTextBadge,
                          {
                            color:
                              item.paymentStatus === 'paid'
                                ? COLORS.success
                                : COLORS.secondary,
                          },
                        ]}
                      >
                        {item.paymentStatus.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}

      {/* FAB - Create Bill */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openNewBillWizard}
        label="New Bill"
        color="#FFFFFF"
      />

      {/* New Bill Wizard Portal */}
      <Portal>
        <Dialog visible={newBillVisible} onDismiss={() => setNewBillVisible(false)} style={styles.wizardDialog}>
          <Dialog.Title>
            New Invoice (Step {wizardStep} of 3)
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            {wizardStep === 1 && (
              <View style={styles.stepContainer}>
                <Text variant="titleSmall" style={styles.stepTitle}>Select Products & Adjust Quantity</Text>
                <Searchbar
                  placeholder="Search products..."
                  value={productSearch}
                  onChangeText={handleProductSearch}
                  style={styles.productSearchbar}
                />
                
                {productList.length === 0 ? (
                  <View style={styles.emptyProducts}>
                    <Text style={{ color: COLORS.textSecondary }}>No products available or out of stock</Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
                    {productList.map((prod) => {
                      const inBasket = !!basket[prod.id];
                      const basketQty = basket[prod.id]?.quantity || 0;
                      return (
                        <View key={prod.id} style={styles.productSelectItem}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.selectProdName}>{prod.name}</Text>
                            <Text style={styles.selectProdMeta}>
                              Stock: {prod.currentStock} {prod.unit}(s) | Price: {formatCurrency(prod.sellingPrice)}
                            </Text>
                          </View>
                          
                          {inBasket ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <IconButton
                                icon="minus-circle-outline"
                                iconColor={COLORS.error}
                                size={22}
                                style={{ margin: 0, padding: 0 }}
                                onPress={() => adjustBasketItemQty(prod.id, -1)}
                              />
                              <RNTextInput
                                value={basketQty.toString()}
                                onChangeText={(text) => handleQuantityTextChange(prod.id, text)}
                                style={{
                                  width: 40,
                                  height: 28,
                                  borderWidth: 1,
                                  borderColor: COLORS.border,
                                  borderRadius: 4,
                                  textAlign: 'center',
                                  color: COLORS.textPrimary,
                                  backgroundColor: '#FFFFFF',
                                  fontSize: 14,
                                  padding: 0,
                                }}
                                keyboardType="numeric"
                              />
                              <IconButton
                                icon="plus-circle-outline"
                                iconColor={COLORS.primary}
                                size={22}
                                style={{ margin: 0, padding: 0 }}
                                onPress={() => adjustBasketItemQty(prod.id, 1)}
                              />
                            </View>
                          ) : (
                            <Pressable
                              onPress={() => toggleBasketItem(prod)}
                              style={({ pressed }) => [
                                {
                                  backgroundColor: pressed ? COLORS.primaryLight : COLORS.primary,
                                  paddingHorizontal: 16,
                                  paddingVertical: 6,
                                  borderRadius: 6,
                                  minWidth: 55,
                                  alignItems: 'center',
                                }
                              ]}
                            >
                              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>
                                Add
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
                
                {Object.keys(basket).length > 0 && (
                  <View style={styles.selectedCount}>
                    <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>
                      Selected: {Object.keys(basket).length} item(s) | Subtotal: {formatCurrency(calculateSubtotal())}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {wizardStep === 2 && (
              <ScrollView style={styles.stepContainer}>
                <Text variant="titleSmall" style={styles.stepTitle}>Enter Customer & Billing Information</Text>
                
                <TextInput
                  label="Customer Name *"
                  value={customerName}
                  onChangeText={setCustomerName}
                  mode="outlined"
                  style={styles.formInput}
                />
                
                <TextInput
                  label="Customer Mobile Number *"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  mode="outlined"
                  style={styles.formInput}
                />

                <TextInput
                  label="Customer Aadhar Number (12 digits) *"
                  value={customerAadhar}
                  onChangeText={setCustomerAadhar}
                  keyboardType="numeric"
                  maxLength={12}
                  mode="outlined"
                  style={styles.formInput}
                />

                <TextInput
                  label="Discount Amount (₹)"
                  value={discountAmount}
                  onChangeText={setDiscountAmount}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.formInput}
                />

                <Text style={styles.label}>Payment Method</Text>
                <SegmentedButtons
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as any)}
                  buttons={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'upi', label: 'UPI' },
                    { value: 'credit', label: 'Credit' },
                  ]}
                  style={{ marginBottom: 12 }}
                />

                <TextInput
                  label="Additional Notes / Remarks"
                  value={notes}
                  onChangeText={setNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  style={styles.formInput}
                />
              </ScrollView>
            )}

            {wizardStep === 3 && (
              <ScrollView style={styles.stepContainer}>
                <Text variant="titleSmall" style={styles.stepTitle}>Verify Invoice Details</Text>
                
                <Card style={styles.reviewCard}>
                  <Card.Content>
                    <Text style={styles.reviewHeader}>CUSTOMER DETAILS</Text>
                    <Text style={styles.reviewText}><Text style={{ fontWeight: 'bold' }}>Name:</Text> {customerName}</Text>
                    <Text style={styles.reviewText}><Text style={{ fontWeight: 'bold' }}>Mobile:</Text> {customerPhone}</Text>
                    <Text style={styles.reviewText}><Text style={{ fontWeight: 'bold' }}>Aadhar:</Text> {customerAadhar}</Text>
                    <Text style={styles.reviewText}><Text style={{ fontWeight: 'bold' }}>Payment Mode:</Text> {paymentMethod.toUpperCase()}</Text>

                  </Card.Content>
                </Card>

                <Card style={styles.reviewCard}>
                  <Card.Content>
                    <Text style={styles.reviewHeader}>SELECTED PRODUCTS</Text>
                    {Object.values(basket).map((item) => (
                      <View key={item.productId} style={styles.reviewProductRow}>
                        <Text style={{ flex: 1 }}>{item.name} (x{item.quantity})</Text>
                        <Text>{formatCurrency(item.sellingPrice * item.quantity)}</Text>
                      </View>
                    ))}
                    <Divider style={{ marginVertical: 8 }} />
                    <View style={styles.reviewTotalRow}>
                      <Text>Subtotal:</Text>
                      <Text>{formatCurrency(calculateSubtotal())}</Text>
                    </View>
                    <View style={styles.reviewTotalRow}>
                      <Text style={{ color: COLORS.error }}>Discount:</Text>
                      <Text style={{ color: COLORS.error }}>- {formatCurrency(parseFloat(discountAmount) || 0)}</Text>
                    </View>
                    <View style={[styles.reviewTotalRow, { marginTop: 4 }]}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: COLORS.primary }}>Total Bill Amount:</Text>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: COLORS.primary }}>{formatCurrency(calculateTotal())}</Text>
                    </View>
                  </Card.Content>
                </Card>
              </ScrollView>
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            {wizardStep > 1 && (
              <Button onPress={() => setWizardStep((prev) => prev - 1)} textColor={COLORS.textSecondary}>
                Back
              </Button>
            )}
            <Button onPress={() => setNewBillVisible(false)} textColor={COLORS.error}>
              Cancel
            </Button>
            {wizardStep < 3 ? (
              <Button onPress={handleNextStep} mode="contained" buttonColor={COLORS.primary}>
                Next
              </Button>
            ) : (
              <Button
                onPress={handleCreateBill}
                mode="contained"
                buttonColor={COLORS.success}
                loading={savingBill}
                disabled={savingBill}
              >
                Generate Bill
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Bill Details Dialog */}
      <Portal>
        <Dialog visible={detailsVisible} onDismiss={() => setDetailsVisible(false)} style={styles.detailsDialog}>
          <Dialog.Title>Invoice Details</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            {selectedBill && (
              <ScrollView contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 16 }}>
                <View style={styles.detailsHeader}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{selectedBill.billNumber}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{formatDate(selectedBill.createdAt)}</Text>
                </View>
                <Divider style={{ marginVertical: 10 }} />
                
                <Text style={styles.detailsSectionTitle}>Customer Details</Text>
                <Text style={styles.detailsText}><Text style={{ fontWeight: 'bold' }}>Name:</Text> {selectedBill.customerName}</Text>
                <Text style={styles.detailsText}><Text style={{ fontWeight: 'bold' }}>Phone:</Text> {selectedBill.customerPhone}</Text>
                <Text style={styles.detailsText}><Text style={{ fontWeight: 'bold' }}>Aadhar Number:</Text> {selectedBill.customerAadhar || 'N/A'}</Text>

                
                <Divider style={{ marginVertical: 10 }} />
                
                <Text style={styles.detailsSectionTitle}>Purchased Items</Text>
                {selectedBill.items.map((item, idx) => (
                  <View key={item.id || idx} style={styles.detailsProductRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', fontSize: 13 }}>{item.productName}</Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                        {item.quantity} {item.unit}(s) x {formatCurrency(item.pricePerUnit)}
                      </Text>
                    </View>
                    <Text style={{ fontWeight: 'bold' }}>{formatCurrency(item.totalPrice)}</Text>
                  </View>
                ))}
                
                <Divider style={{ marginVertical: 10 }} />
                
                <View style={styles.detailsTotalRow}>
                  <Text>Subtotal:</Text>
                  <Text>{formatCurrency(selectedBill.subtotal)}</Text>
                </View>
                <View style={styles.detailsTotalRow}>
                  <Text>Discount:</Text>
                  <Text style={{ color: COLORS.error }}>- {formatCurrency(selectedBill.discountAmount)}</Text>
                </View>
                <View style={[styles.detailsTotalRow, { marginTop: 6 }]}>
                  <Text style={{ fontWeight: 'bold', fontSize: 15, color: COLORS.primary }}>Grand Total:</Text>
                  <Text style={{ fontWeight: 'bold', fontSize: 15, color: COLORS.primary }}>{formatCurrency(selectedBill.totalAmount)}</Text>
                </View>

                <Divider style={{ marginVertical: 10 }} />
                <Text style={styles.detailsText}><Text style={{ fontWeight: 'bold' }}>Payment Mode:</Text> {selectedBill.paymentMethod.toUpperCase()}</Text>
                {selectedBill.notes && (
                  <Text style={styles.detailsText}><Text style={{ fontWeight: 'bold' }}>Notes:</Text> {selectedBill.notes}</Text>
                )}

              </ScrollView>
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            {selectedBill && (
              <Button
                icon="file-pdf-box"
                onPress={() => generatePdfInvoice(selectedBill)}
                mode="contained"
                buttonColor={COLORS.success}
                loading={printingPdf}
                disabled={printingPdf}
                style={{ marginRight: 8 }}
              >
                Download PDF
              </Button>
            )}
            <Button onPress={() => setDetailsVisible(false)} textColor={COLORS.textSecondary}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchbar: { backgroundColor: '#FFFFFF', elevation: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8 },
  listContent: { padding: 16, paddingBottom: 90, gap: 12 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, color: '#64748B' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 40 },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  emptySubtext: { color: '#64748B', textAlign: 'center', lineHeight: 20, fontSize: 13 },
  billCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  billContent: { padding: 12 },
  billHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billNumWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billNumberText: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 13,
  },
  billDateText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  billDivider: {
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  billMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  custNameText: {
    fontWeight: '600',
    color: '#1E293B',
    fontSize: 13,
  },
  custPhoneText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  billAmtText: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusTextBadge: {
    fontSize: 9,
    fontWeight: '700',
  },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
  
  // Dialog / Wizard Layouts
  wizardDialog: { backgroundColor: '#FFFFFF', borderRadius: 16, maxHeight: '85%', width: '92%', alignSelf: 'center' },
  detailsDialog: { backgroundColor: '#FFFFFF', borderRadius: 16, maxHeight: '85%' },
  dialogScrollArea: {
    paddingHorizontal: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.divider,
  },
  stepContainer: { padding: 16 },
  stepTitle: { fontWeight: 'bold', color: COLORS.primary, marginBottom: 14, textAlign: 'center' },
  productSearchbar: { backgroundColor: COLORS.background, elevation: 0, marginBottom: 10, borderRadius: 8 },
  emptyProducts: { padding: 24, alignItems: 'center' },
  productSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  selectProdName: { fontWeight: '600', fontSize: 14, color: COLORS.textPrimary },
  selectProdMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  addButton: { borderRadius: 6, minWidth: 60, height: 32, justifyContent: 'center' },
  qtyAdjuster: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, backgroundColor: '#FFFFFF' },
  qtyInput: { width: 36, textAlign: 'center', height: 30, backgroundColor: '#FFFFFF', fontSize: 14, paddingHorizontal: 0, marginHorizontal: 2 },
  selectedCount: { marginTop: 14, padding: 10, backgroundColor: COLORS.primarySurface, borderRadius: 8, alignItems: 'center' },
  formInput: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: 6 },
  
  // Review Cards
  reviewCard: { marginBottom: 12, borderRadius: 10, elevation: 1, backgroundColor: '#FFFFFF' },
  reviewHeader: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1, marginBottom: 8 },
  reviewText: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 4 },
  reviewProductRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },

  // Details dialog
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailsSectionTitle: { fontWeight: 'bold', fontSize: 12, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  detailsText: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 4 },
  detailsProductRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  detailsTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
});
