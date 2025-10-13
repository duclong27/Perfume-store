import { sequelize } from "../config/sequelize.js";

// ===== Models =====
import User from "./User.js";
import Role from "./Role.js";
import UserRole from "./UserRole.js";

import Address from "./Address.js";

import Category from "./Category.js";
import Product from "./Product.js";
import ProductVariant from "./ProductVariant.js";

import Cart from "./Cart.js";
import CartItem from "./CartItem.js";

import Order from "./Order.js";
import OrderItem from "./OrderItem.js";
import Payment from "./Payment.js";
import PaymentTransaction from "./PaymentTransactions.js";

// ========== Associations ==========

// 1) User ↔ Address (1 - n)
User.hasMany(Address, { foreignKey: "userId", as: "addresses" });
Address.belongsTo(User, { foreignKey: "userId", as: "user" });

// 2) User ↔ Role (n - n) qua UserRole
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "userId",
  otherKey: "roleId",
  as: "roles",
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "roleId",
  otherKey: "userId",
  as: "users",
});

// 3) Category ↔ Product (1 - n)
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

// 4) Product ↔ ProductVariant (1 - n)
Product.hasMany(ProductVariant, { foreignKey: "productId", as: "variants" });
ProductVariant.belongsTo(Product, { foreignKey: "productId", as: "product" });

// 5) User ↔ Cart (1 - 1)
User.hasOne(Cart, { foreignKey: "userId", as: "cart" });
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });

// 6) Cart ↔ CartItem (1 - n)
Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items" });
CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });

// 7) ProductVariant ↔ CartItem (1 - n)  (mỗi item tham chiếu 1 variant cụ thể)
ProductVariant.hasMany(CartItem, { foreignKey: "variantId", as: "cartItems" });
CartItem.belongsTo(ProductVariant, { foreignKey: "variantId", as: "variant" });

// 8) User ↔ Order (1 - n)
User.hasMany(Order, { foreignKey: "userId", as: "orders" });
Order.belongsTo(User, { foreignKey: "userId", as: "user" });

// 9) Address ↔ Order (1 - n)  (nếu đơn hàng lưu address snapshot qua addressId)
Address.hasMany(Order, { foreignKey: "addressId", as: "orders" });
Order.belongsTo(Address, { foreignKey: "addressId", as: "shippingAddressRef" });

// 10) Order ↔ OrderItem (1 - n)
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

// 11) Product / ProductVariant ↔ OrderItem
Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

ProductVariant.hasMany(OrderItem, { foreignKey: "variantId", as: "orderItems" });
OrderItem.belongsTo(ProductVariant, { foreignKey: "variantId", as: "variant" });

// 12) Order ↔ Payment
// Nếu bạn cho phép nhiều lần thanh toán/attempt → hasMany
Order.hasMany(Payment, { foreignKey: "orderId", as: "payments" });
Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });

// 13) Order ↔ PaymentTransaction
Order.hasMany(PaymentTransaction, { as: "paymentTransactions", foreignKey: "orderId", sourceKey: "orderId" });
PaymentTransaction.belongsTo(Order, { as: "order", foreignKey: "orderId", targetKey: "orderId" });



// ==================================



// Export tất cả để nơi khác import dùng
export {
  sequelize,
  User,
  Role,
  UserRole,
  Address,
  Category,
  Product,
  ProductVariant,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  PaymentTransaction
};
