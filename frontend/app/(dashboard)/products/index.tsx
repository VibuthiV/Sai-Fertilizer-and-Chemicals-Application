// app/(dashboard)/products/index.tsx — Products Screen

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, Pressable } from 'react-native';
import {
  Text,
  FAB,
  Searchbar,
  Card,
  Chip,
  Dialog,
  Portal,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { COLORS } from '@/constants/colors';
import { productService } from '@/services/productService';
import { Product } from '@/types/product.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Fertilizer');
  const [formUnit, setFormUnit] = useState('bag'); // e.g. bags, kgs, litres, pieces
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formSellingPrice, setFormSellingPrice] = useState('');
  const [formCurrentStock, setFormCurrentStock] = useState('');
  const [formLowStockThreshold, setFormLowStockThreshold] = useState('10');
  const [formDescription, setFormDescription] = useState('');

  const fetchProducts = async (queryStr = searchQuery, isLow = filter === 'low') => {
    try {
      setLoading(true);
      const res = await productService.getAll({
        search: queryStr || undefined,
        lowStock: isLow ? true : undefined,
        page: 1,
        limit: 100, // Load a reasonable list for dev/shop operations
      });
      setProducts(res.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    fetchProducts(query);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts(searchQuery);
  };

  const openAddDialog = () => {
    setDialogMode('add');
    setSelectedProduct(null);
    setFormName('');
    setFormSku('');
    setFormCategory('Fertilizer');
    setFormUnit('bag');
    setFormPurchasePrice('');
    setFormSellingPrice('');
    setFormCurrentStock('');
    setFormLowStockThreshold('10');
    setFormDescription('');
    setDialogVisible(true);
  };

  const openEditDialog = (product: Product) => {
    setDialogMode('edit');
    setSelectedProduct(product);
    setFormName(product.name);
    setFormSku(product.sku || '');
    setFormCategory(product.category || 'Fertilizer');
    setFormUnit(product.unit);
    setFormPurchasePrice(product.purchasePrice.toString());
    setFormSellingPrice(product.sellingPrice.toString());
    setFormCurrentStock(product.currentStock.toString());
    setFormLowStockThreshold(product.lowStockThreshold.toString());
    setFormDescription(product.description || '');
    setDialogVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Product Name is required');
      return;
    }
    if (!formUnit.trim()) {
      Alert.alert('Validation Error', 'Storage unit type (e.g. bags, kgs) is required');
      return;
    }

    // Check for duplicate name (case-insensitive check)
    const nameExists = products.some(
      (p) =>
        p.name.toLowerCase() === formName.trim().toLowerCase() &&
        (dialogMode === 'add' || p.id !== selectedProduct?.id)
    );
    if (nameExists) {
      Alert.alert(
        'Duplicate Product',
        'A product with this name already exists. Please edit that product instead of adding a new one.'
      );
      return;
    }

    const purchasePrice = parseFloat(formPurchasePrice);
    const sellingPrice = parseFloat(formSellingPrice);
    const currentStock = parseFloat(formCurrentStock);
    const lowStockThreshold = parseFloat(formLowStockThreshold);

    if (isNaN(purchasePrice) || purchasePrice < 0) {
      Alert.alert('Validation Error', 'Invalid purchase price');
      return;
    }
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      Alert.alert('Validation Error', 'Invalid selling price');
      return;
    }
    if (isNaN(currentStock) || currentStock < 0) {
      Alert.alert('Validation Error', 'Invalid quantity/stock value');
      return;
    }

    const productPayload = {
      name: formName.trim(),
      sku: formSku.trim() || undefined,
      category: formCategory,
      unit: formUnit.trim(),
      purchasePrice,
      sellingPrice,
      currentStock,
      lowStockThreshold: isNaN(lowStockThreshold) ? 10 : lowStockThreshold,
      description: formDescription.trim() || undefined,
    };

    try {
      if (dialogMode === 'add') {
        await productService.create(productPayload);
        Alert.alert('Success', 'Product added successfully');
      } else if (dialogMode === 'edit' && selectedProduct) {
        await productService.update(selectedProduct.id, productPayload);
        Alert.alert('Success', 'Product updated successfully');
      }
      setDialogVisible(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      const msg = error?.response?.data?.message || 'Failed to save product details';
      Alert.alert('Error', msg);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete product '${product.name}'?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productService.delete(product.id);
              Alert.alert('Success', 'Product deleted successfully');
              fetchProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Fertilizer': return COLORS.primary;
      case 'Pesticide': return '#E53935'; // red
      case 'Herbicide': return '#D84315'; // rust orange
      case 'Seed': return '#FFA000'; // amber
      case 'Equipment': return '#0288D1'; // blue
      default: return '#78909C'; // grey
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search products..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.chipRow}>
        <Chip
          selected={filter === 'all'}
          style={[styles.chip, filter === 'all' && styles.chipActive]}
          textStyle={[styles.chipText, filter === 'all' && styles.chipTextActive]}
          onPress={() => setFilter('all')}
          showSelectedOverlay
        >
          All Items
        </Chip>
        <Chip
          selected={filter === 'low'}
          style={[styles.chip, filter === 'low' && styles.chipActive]}
          textStyle={[styles.chipText, filter === 'low' && styles.chipTextActive]}
          onPress={() => setFilter('low')}
          showSelectedOverlay
        >
          Low Stock Alert
        </Chip>
      </View>

      {/* Product List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching product list...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="package-variant-closed" size={48} color={COLORS.textDisabled} />
              </View>
              <Text variant="titleMedium" style={styles.emptyTitle}>No Products Found</Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                No products match the criteria. Create one or refresh the list!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLowStock = item.currentStock <= item.lowStockThreshold;
            return (
              <Card style={styles.productCard} onPress={() => openEditDialog(item)}>
                <View style={{ flexDirection: 'row', minHeight: 90 }}>
                  <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor(item.category) }]} />
                  <Card.Content style={styles.productCardContent}>
                    <View style={styles.productHeader}>
                      <View style={styles.titleCol}>
                        <Text variant="titleMedium" style={styles.productName}>
                          {item.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.productSku}>
                          SKU: {item.sku || 'N/A'} • {item.category}
                        </Text>
                      </View>
                      {isLowStock && (
                        <View style={styles.lowStockBadge}>
                          <MaterialCommunityIcons name="alert-circle-outline" size={12} color={COLORS.error} />
                          <Text style={styles.lowStockBadgeText}>LOW</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.productDetails}>
                      <View style={styles.stockInfo}>
                        <MaterialCommunityIcons name="archive-outline" size={15} color={isLowStock ? COLORS.error : '#64748B'} />
                        <Text style={styles.detailsLabel}>Stock: </Text>
                        <Text
                          style={[
                            styles.detailsValue,
                            isLowStock ? styles.lowStockText : styles.normalStockText,
                          ]}
                        >
                          {item.currentStock} {item.unit}(s)
                        </Text>
                      </View>

                      <View style={styles.priceInfo}>
                        <MaterialCommunityIcons name="currency-inr" size={13} color="#64748B" />
                        <Text style={styles.detailsLabel}>Sell: </Text>
                        <Text style={styles.priceText}>{formatCurrency(item.sellingPrice)}</Text>
                        <Text style={styles.buyText}> ({formatCurrency(item.purchasePrice)} buy)</Text>
                      </View>
                    </View>
                  </Card.Content>
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* Add FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddDialog}
        label="Add Product"
        color="#FFFFFF"
      />

      {/* Add/Edit Product Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>{dialogMode === 'add' ? 'Add Product' : 'Edit Product'}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <FlatList
              data={[{ id: 'form' }]}
              keyExtractor={(item) => item.id}
              renderItem={() => (
                <View style={styles.formContainer}>
                  <TextInput
                    label="Product Name"
                    value={formName}
                    onChangeText={setFormName}
                    mode="outlined"
                    style={styles.formInput}
                    outlineColor={COLORS.border}
                    activeOutlineColor={COLORS.primary}
                  />

                  <TextInput
                    label="SKU / Barcode"
                    value={formSku}
                    onChangeText={setFormSku}
                    mode="outlined"
                    style={styles.formInput}
                    outlineColor={COLORS.border}
                    activeOutlineColor={COLORS.primary}
                  />

                  <TextInput
                    label="Category (e.g. Fertilizer, Pesticide)"
                    value={formCategory}
                    onChangeText={setFormCategory}
                    mode="outlined"
                    style={styles.formInput}
                    outlineColor={COLORS.border}
                    activeOutlineColor={COLORS.primary}
                  />

                  <View style={styles.formRow}>
                    <TextInput
                      label="Storage Unit (e.g. bag, kg)"
                      value={formUnit}
                      onChangeText={setFormUnit}
                      mode="outlined"
                      style={[styles.formInput, { flex: 1, marginRight: 8 }]}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                      label="Total Stock Qty"
                      value={formCurrentStock}
                      onChangeText={setFormCurrentStock}
                      keyboardType="numeric"
                      mode="outlined"
                      style={[styles.formInput, { flex: 1 }]}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <TextInput
                      label="Purchase Price (₹)"
                      value={formPurchasePrice}
                      onChangeText={setFormPurchasePrice}
                      keyboardType="numeric"
                      mode="outlined"
                      style={[styles.formInput, { flex: 1, marginRight: 8 }]}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                    <TextInput
                      label="Selling Price (₹)"
                      value={formSellingPrice}
                      onChangeText={setFormSellingPrice}
                      keyboardType="numeric"
                      mode="outlined"
                      style={[styles.formInput, { flex: 1 }]}
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>

                  <TextInput
                    label="Low Stock Alert Threshold"
                    value={formLowStockThreshold}
                    onChangeText={setFormLowStockThreshold}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.formInput}
                    outlineColor={COLORS.border}
                    activeOutlineColor={COLORS.primary}
                  />

                  <TextInput
                    label="Description"
                    value={formDescription}
                    onChangeText={setFormDescription}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    style={styles.formInput}
                    outlineColor={COLORS.border}
                    activeOutlineColor={COLORS.primary}
                  />
                </View>
              )}
            />
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ justifyContent: 'space-between', width: '100%', paddingHorizontal: 16 }}>
            <View>
              {dialogMode === 'edit' && selectedProduct && (
                <Button
                  onPress={() => handleDeleteProduct(selectedProduct)}
                  textColor={COLORS.error}
                  icon="delete"
                >
                  Delete
                </Button>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button onPress={() => setDialogVisible(false)} textColor={COLORS.textSecondary}>
                Cancel
              </Button>
              <Button onPress={handleSaveProduct} mode="contained" buttonColor={COLORS.primary}>
                Save
              </Button>
            </View>
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
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: { padding: 16, paddingBottom: 90, gap: 12 },
  categoryIndicator: {
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  productCard: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1.5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  productCardContent: {
    flex: 1,
    padding: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleCol: {
    flex: 1,
  },
  productName: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 15,
  },
  productSku: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  buyText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  normalStockText: {
    color: COLORS.primary,
  },
  lowStockText: {
    color: COLORS.error,
  },
  lowStockBadge: {
    backgroundColor: COLORS.error + '12', // light transparent red
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  lowStockBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.error,
  },
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.divider,
  },
  formContainer: {
    padding: 16,
  },
  formInput: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
});
