// appwrite.js - Web SDK configuration
import { Client, Account, Databases, Storage, ID, Permission, Role, Query } from 'appwrite';

export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || '',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
};

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const IDs = ID;

export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
export const APPWRITE_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || '';

// APPWRITE_DATABASE_ID Tables IDs
export const COLLECTION_USERS_ID = import.meta.env.VITE_COLLECTION_USERS_ID || '';
export const COLLECTION_STORIES_ID = import.meta.env.VITE_COLLECTION_STORIES_ID || '';
export const COLLECTION_POSTS_ID = import.meta.env.VITE_COLLECTION_POSTS_ID || '';
export const COLLECTION_NOTIFICATIONS_ID = import.meta.env.VITE_COLLECTION_NOTIFICATIONS_ID || '';
export const COLLECTION_REELS_ID = import.meta.env.VITE_COLLECTION_REELS_ID || '';
export const COLLECTION_FOLLOWS_ID = import.meta.env.VITE_COLLECTION_FOLLOWS_ID || '';
export const COLLECTION_COMMENTS_ID = import.meta.env.VITE_COLLECTION_COMMENTS_ID || '';

// NEW COLLECTIONS - FOR SHOP - CART/ORDERS/WISHLIST/BOOKMARKS
export const COLLECTION_SHOP_CART_ID = import.meta.env.VITE_COLLECTION_SHOP_CART_ID || '';
export const COLLECTION_SHOP_ORDERS_ID = import.meta.env.VITE_COLLECTION_SHOP_ORDERS_ID || '';
export const COLLECTION_SHOP_WISHLIST_ID = import.meta.env.VITE_COLLECTION_SHOP_WISHLIST_ID || '';
export const COLLECTION_SHOP_BOOKMARKS_ID = import.meta.env.VITE_COLLECTION_SHOP_BOOKMARKS_ID || '';

// Orders collection - alias for COLLECTION_SHOP_ORDERS_ID
export const COLLECTION_ORDERS_ID = COLLECTION_SHOP_ORDERS_ID;

// Order Results collection for completed orders
export const COLLECTION_ORDER_RESULT_ID = import.meta.env.VITE_COLLECTION_ORDER_RESULT_ID || '';

// SHOP COLLECTIONS - PRODUCTS AND SELLERS
export const COLLECTION_PRODUCTS_ID = import.meta.env.VITE_COLLECTION_PRODUCTS_ID || '';
export const COLLECTION_SELLERS_ID = import.meta.env.VITE_COLLECTION_SELLERS_ID || '';

// USER ACCOUNTS COLLECTION - For multi-account support
export const COLLECTION_USER_ACCOUNTS_ID = import.meta.env.VITE_COLLECTION_USER_ACCOUNTS_ID || '';

export default client;

export { Permission, Role, Query };

