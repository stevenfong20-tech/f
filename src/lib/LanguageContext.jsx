import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  zh: {
    // Nav
    appName: '正好吃鹹酥雞',
    dashboard: '儀表板',
    orders: '訂單管理',
    products: '商品管理',
    branches: '分店管理',
    newOrder: '新增訂單',
    settings: '設定',
    logout: '登出',
    
    // Common
    save: '儲存',
    cancel: '取消',
    delete: '刪除',
    edit: '編輯',
    add: '新增',
    confirm: '確認',
    search: '搜尋',
    loading: '載入中...',
    noData: '暫無資料',
    total: '合計',
    amount: '金額',
    quantity: '數量',
    unit: '單位',
    price: '單價',
    name: '名稱',
    status: '狀態',
    date: '日期',
    notes: '備註',
    actions: '操作',
    
    // Auth
    welcome: '歡迎回來',
    loginSubtitle: '請登入您的帳號',
    email: '電子郵件',
    password: '密碼',
    login: '登入',
    
    // Dashboard
    totalOrders: '總訂單數',
    totalRevenue: '總金額',
    activeBranches: '活躍分店',
    pendingOrders: '待處理訂單',
    recentOrders: '最近訂單',
    topBranches: '訂購最多的分店',
    
    // Orders
    orderNo: '訂單編號',
    branch: '分店',
    orderDate: '訂購日期',
    totalAmount: '訂單金額',
    orderStatus: '訂單狀態',
    orderItems: '訂單商品',
    placeOrder: '送出訂單',
    orderHistory: '訂單記錄',
    currentOrder: '目前訂單',
    previousOrder: '上次訂單',
    variantAlert: '訂單變動提醒',
    variantAlertMsg: '本次訂單與上次訂單相比變動超過 60%，確定要送出嗎？',
    variantIncrease: '增加',
    variantDecrease: '減少',
    
    // Status
    pending: '待處理',
    preparing: '備餐中',
    ready_for_pickup: '可取餐',
    completed: '已完成',
    cancelled: '已取消',
    
    // Products
    productName: '商品名稱',
    category: '分類',
    unitPrice: '單價（元）',
    minQty: '最小訂購量',
    addProduct: '新增商品',
    editProduct: '編輯商品',
    deleteProduct: '刪除商品',
    confirmDelete: '確認刪除',
    deleteConfirmMsg: '確定要刪除此商品嗎？此操作無法復原。',
    productActive: '上架',
    productInactive: '下架',
    
    // Branches
    branchName: '分店名稱',
    address: '地址',
    phone: '電話',
    manager: '負責人',
    addBranch: '新增分店',
    editBranch: '編輯分店',
    viewOrders: '查看訂單',
    combinedOrders: '合併訂單',
    branchDetails: '分店詳情',
    
    // Settings
    language: '語言設定',
    languageZh: '繁體中文',
    languageEn: 'English',
    
    // Alerts
    orderSuccess: '訂單送出成功',
    orderError: '訂單送出失敗',
    saveSuccess: '儲存成功',
    deleteSuccess: '刪除成功',
    
    // Role
    supplier: '供應商',
    branchStaff: '分店員工',
    myBranch: '我的分店',
  },
  en: {
    // Nav
    appName: '正好吃鹹酥雞',
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    branches: 'Branches',
    newOrder: 'New Order',
    settings: 'Settings',
    logout: 'Logout',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    confirm: 'Confirm',
    search: 'Search',
    loading: 'Loading...',
    noData: 'No data',
    total: 'Total',
    amount: 'Amount',
    quantity: 'Qty',
    unit: 'Unit',
    price: 'Price',
    name: 'Name',
    status: 'Status',
    date: 'Date',
    notes: 'Notes',
    actions: 'Actions',
    
    // Auth
    welcome: 'Welcome Back',
    loginSubtitle: 'Sign in to your account',
    email: 'Email',
    password: 'Password',
    login: 'Sign In',
    
    // Dashboard
    totalOrders: 'Total Orders',
    totalRevenue: 'Total Revenue',
    activeBranches: 'Active Branches',
    pendingOrders: 'Pending Orders',
    recentOrders: 'Recent Orders',
    topBranches: 'Top Ordering Branches',
    
    // Orders
    orderNo: 'Order No.',
    branch: 'Branch',
    orderDate: 'Order Date',
    totalAmount: 'Total Amount',
    orderStatus: 'Status',
    orderItems: 'Order Items',
    placeOrder: 'Place Order',
    orderHistory: 'Order History',
    currentOrder: 'Current Order',
    previousOrder: 'Previous Order',
    variantAlert: 'Order Variance Alert',
    variantAlertMsg: 'This order differs from your last order by more than 60%. Are you sure you want to proceed?',
    variantIncrease: 'increase',
    variantDecrease: 'decrease',
    
    // Status
    pending: 'Pending',
    preparing: 'Preparing',
    ready_for_pickup: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled',
    
    // Products
    productName: 'Product Name',
    category: 'Category',
    unitPrice: 'Unit Price (NTD)',
    minQty: 'Min. Order Qty',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    deleteProduct: 'Delete Product',
    confirmDelete: 'Confirm Delete',
    deleteConfirmMsg: 'Are you sure you want to delete this product? This action cannot be undone.',
    productActive: 'Active',
    productInactive: 'Inactive',
    
    // Branches
    branchName: 'Branch Name',
    address: 'Address',
    phone: 'Phone',
    manager: 'Manager',
    addBranch: 'Add Branch',
    editBranch: 'Edit Branch',
    viewOrders: 'View Orders',
    combinedOrders: 'Combined Orders',
    branchDetails: 'Branch Details',
    
    // Settings
    language: 'Language',
    languageZh: '繁體中文',
    languageEn: 'English',
    
    // Alerts
    orderSuccess: 'Order placed successfully',
    orderError: 'Failed to place order',
    saveSuccess: 'Saved successfully',
    deleteSuccess: 'Deleted successfully',
    
    // Role
    supplier: 'Supplier',
    branchStaff: 'Branch Staff',
    myBranch: 'My Branch',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'zh';
  });

  const toggleLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
