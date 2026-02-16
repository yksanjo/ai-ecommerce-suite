import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ============ DATA STORES (In-Memory for MVP) ============
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  features: string[];
  rating: number;
  inStock: boolean;
}

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Booking {
  id: string;
  serviceType: string;
  customerName: string;
  date: Date;
  time: string;
  guests?: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  type: 'income' | 'expense';
}

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

// In-memory data stores
const products: Map<string, Product> = new Map();
const cart: CartItem[] = [];
const bookings: Map<string, Booking> = new Map();
const transactions: Map<string, Transaction> = new Map();
const budgets: Map<string, Budget> = new Map();

// Seed some mock products
const mockProducts: Product[] = [
  { id: '1', name: 'Wireless Headphones', description: 'Premium noise-cancelling headphones', price: 299.99, category: 'Electronics', features: ['Noise cancellation', '30h battery', 'Bluetooth 5.0'], rating: 4.5, inStock: true },
  { id: '2', name: 'Smart Watch', description: 'Fitness tracking smartwatch', price: 199.99, category: 'Electronics', features: ['Heart rate monitor', 'GPS', 'Water resistant'], rating: 4.3, inStock: true },
  { id: '3', name: 'Laptop Stand', description: 'Ergonomic laptop stand', price: 49.99, category: 'Accessories', features: ['Adjustable height', 'Foldable', 'Aluminum'], rating: 4.7, inStock: true },
  { id: '4', name: 'Mechanical Keyboard', description: 'RGB mechanical gaming keyboard', price: 129.99, category: 'Electronics', features: ['RGB lighting', 'Hot-swappable', 'Wireless'], rating: 4.6, inStock: true },
  { id: '5', name: 'USB-C Hub', description: '7-in-1 USB-C hub', price: 79.99, category: 'Accessories', features: ['HDMI', 'USB 3.0', 'SD card reader'], rating: 4.2, inStock: true },
];
mockProducts.forEach(p => products.set(p.id, p));

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// ============ TOOL DEFINITIONS ============

// Shopping Tools
const shoppingTools = [
  {
    name: 'search_products',
    description: 'Search for products by keyword or category',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        category: { type: 'string', description: 'Filter by category' },
        maxPrice: { type: 'number', description: 'Maximum price' },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'add_to_cart',
    description: 'Add a product to the shopping cart',
    inputSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'ID of the product' },
        quantity: { type: 'number', description: 'Quantity to add', default: 1 },
      },
      required: ['productId'],
    },
  },
  {
    name: 'view_cart',
    description: 'View current shopping cart contents',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'compare_products',
    description: 'Compare multiple products by features and price',
    inputSchema: {
      type: 'object',
      properties: {
        productIds: { type: 'array', items: { type: 'string' }, description: 'Product IDs to compare' },
      },
      required: ['productIds'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'apply_discount',
    description: 'Find and apply a discount code to the cart',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Discount code' },
      },
      required: ['code'],
    },
  },
  {
    name: 'checkout',
    description: 'Complete the purchase with current cart items',
    inputSchema: {
      type: 'object',
      properties: {
        paymentMethod: { type: 'string', description: 'Payment method' },
      },
    },
  },
];

// Booking Tools
const bookingTools = [
  {
    name: 'check_availability',
    description: 'Check availability for dates and services',
    inputSchema: {
      type: 'object',
      properties: {
        serviceType: { type: 'string', description: 'Type of service (hotel, restaurant, flight)' },
        date: { type: 'string', description: 'Date to check (YYYY-MM-DD)' },
        guests: { type: 'number', description: 'Number of guests' },
      },
      required: ['serviceType', 'date'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'create_booking',
    description: 'Create a new reservation',
    inputSchema: {
      type: 'object',
      properties: {
        serviceType: { type: 'string', description: 'Type of service' },
        customerName: { type: 'string', description: 'Customer name' },
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        time: { type: 'string', description: 'Time slot' },
        guests: { type: 'number', description: 'Number of guests' },
      },
      required: ['serviceType', 'customerName', 'date', 'time'],
    },
  },
  {
    name: 'modify_booking',
    description: 'Modify an existing booking',
    inputSchema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'ID of the booking' },
        newDate: { type: 'string', description: 'New date (YYYY-MM-DD)' },
        newTime: { type: 'string', description: 'New time' },
        newGuests: { type: 'number', description: 'New number of guests' },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'cancel_booking',
    description: 'Cancel an existing booking',
    inputSchema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'ID of the booking to cancel' },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'list_bookings',
    description: 'List all bookings',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['confirmed', 'cancelled', 'completed'] },
      },
    },
    annotations: { readOnlyHint: true },
  },
];

// Banking/Finance Tools
const financeTools = [
  {
    name: 'categorize_transaction',
    description: 'Automatically categorize a transaction',
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: { type: 'string', description: 'ID of the transaction' },
      },
      required: ['transactionId'],
    },
  },
  {
    name: 'create_budget',
    description: 'Create a new budget category with spending limit',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Budget category name' },
        limit: { type: 'number', description: 'Monthly spending limit' },
      },
      required: ['category', 'limit'],
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a financial report',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['weekly', 'monthly', 'yearly'], description: 'Report period' },
        includeCharts: { type: 'boolean', description: 'Include charts', default: false },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'list_transactions',
    description: 'List all transactions',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category' },
        startDate: { type: 'string', description: 'Start date' },
        endDate: { type: 'string', description: 'End date' },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_spending_insights',
    description: 'Analyze spending patterns and provide insights',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month', 'year'], description: 'Analysis period' },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'add_transaction',
    description: 'Add a new transaction',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Transaction description' },
        amount: { type: 'number', description: 'Amount' },
        category: { type: 'string', description: 'Category' },
        type: { type: 'string', enum: ['income', 'expense'] },
      },
      required: ['description', 'amount', 'type'],
    },
  },
];

// Combine all tools
const allTools = [...shoppingTools, ...bookingTools, ...financeTools];

// ============ TOOL EXECUTION HANDLERS ============

async function handleToolCall(name: string, args: any): Promise<any> {
  let activeDiscount = 0;

  switch (name) {
    // Shopping
    case 'search_products': {
      const results = Array.from(products.values()).filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(args.query.toLowerCase()) ||
          p.description.toLowerCase().includes(args.query.toLowerCase());
        const matchesCategory = !args.category || p.category === args.category;
        const matchesPrice = !args.maxPrice || p.price <= args.maxPrice;
        return matchesQuery && matchesCategory && matchesPrice;
      });
      return { success: true, products: results };
    }
    
    case 'add_to_cart': {
      const product = products.get(args.productId);
      if (!product) return { success: false, error: 'Product not found' };
      if (!product.inStock) return { success: false, error: 'Product out of stock' };
      
      const existing = cart.find(item => item.productId === args.productId);
      if (existing) {
        existing.quantity += args.quantity || 1;
      } else {
        cart.push({ productId: args.productId, quantity: args.quantity || 1, price: product.price });
      }
      return { success: true, cart };
    }
    
    case 'view_cart': {
      const cartWithProducts = cart.map(item => {
        const product = products.get(item.productId);
        return { ...item, product };
      });
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discount = total * (activeDiscount / 100);
      return { success: true, cart: cartWithProducts, subtotal: total, discount, total: total - discount };
    }
    
    case 'compare_products': {
      const compareList = args.productIds.map((id: string) => products.get(id)).filter(Boolean);
      return { success: true, products: compareList };
    }
    
    case 'apply_discount': {
      const discountCodes: Record<string, number> = {
        'SAVE10': 10,
        'SAVE20': 20,
        'WELCOME': 15,
        'FLASH50': 50,
      };
      const discount = discountCodes[args.code.toUpperCase()];
      if (discount) {
        activeDiscount = discount;
        return { success: true, discount: `${discount}% off`, code: args.code };
      }
      return { success: false, error: 'Invalid discount code' };
    }
    
    case 'checkout': {
      if (cart.length === 0) return { success: false, error: 'Cart is empty' };
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discount = total * (activeDiscount / 100);
      const finalTotal = total - discount;
      
      // Clear cart after checkout
      cart.length = 0;
      activeDiscount = 0;
      
      return { 
        success: true, 
        order: {
          orderId: generateId(),
          items: cart.length,
          subtotal: total,
          discount,
          total: finalTotal,
          paymentMethod: args.paymentMethod || 'card',
          status: 'confirmed',
        }
      };
    }

    // Booking
    case 'check_availability': {
      // Mock availability check
      const availableSlots = ['9:00 AM', '10:00 AM', '2:00 PM', '4:00 PM'];
      return { 
        success: true, 
        available: true,
        slots: availableSlots,
        serviceType: args.serviceType,
        date: args.date,
      };
    }
    
    case 'create_booking': {
      const booking: Booking = {
        id: generateId(),
        serviceType: args.serviceType,
        customerName: args.customerName,
        date: new Date(args.date),
        time: args.time,
        guests: args.guests || 1,
        status: 'confirmed',
        totalPrice: 0, // Would be calculated based on service
      };
      bookings.set(booking.id, booking);
      return { success: true, booking };
    }
    
    case 'modify_booking': {
      const booking = bookings.get(args.bookingId);
      if (!booking) return { success: false, error: 'Booking not found' };
      if (args.newDate) booking.date = new Date(args.newDate);
      if (args.newTime) booking.time = args.newTime;
      if (args.newGuests) booking.guests = args.newGuests;
      return { success: true, booking };
    }
    
    case 'cancel_booking': {
      const booking = bookings.get(args.bookingId);
      if (!booking) return { success: false, error: 'Booking not found' };
      booking.status = 'cancelled';
      return { success: true, booking };
    }
    
    case 'list_bookings': {
      let result = Array.from(bookings.values());
      if (args.status) result = result.filter(b => b.status === args.status);
      return { success: true, bookings: result };
    }

    // Finance
    case 'categorize_transaction': {
      const transaction = transactions.get(args.transactionId);
      if (!transaction) return { success: false, error: 'Transaction not found' };
      
      // Auto-categorize based on description
      const desc = transaction.description.toLowerCase();
      let category = 'Other';
      if (desc.includes('grocery') || desc.includes('food')) category = 'Food';
      else if (desc.includes('uber') || desc.includes('lyft') || desc.includes('gas')) category = 'Transport';
      else if (desc.includes('netflix') || desc.includes('spotify')) category = 'Entertainment';
      else if (desc.includes('rent') || desc.includes('mortgage')) category = 'Housing';
      else if (desc.includes('salary') || desc.includes('payment')) category = 'Income';
      
      transaction.category = category;
      return { success: true, transaction, suggestedCategory: category };
    }
    
    case 'create_budget': {
      const budget: Budget = {
        id: generateId(),
        category: args.category,
        limit: args.limit,
        spent: 0,
      };
      budgets.set(budget.id, budget);
      return { success: true, budget };
    }
    
    case 'generate_report': {
      const allTransactions = Array.from(transactions.values());
      const income = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      return {
        success: true,
        report: {
          period: args.period,
          totalIncome: income,
          totalExpenses: expenses,
          netBalance: income - expenses,
          transactionCount: allTransactions.length,
        }
      };
    }
    
    case 'list_transactions': {
      let result = Array.from(transactions.values());
      if (args.category) result = result.filter(t => t.category === args.category);
      if (args.startDate) result = result.filter(t => t.date >= new Date(args.startDate));
      if (args.endDate) result = result.filter(t => t.date <= new Date(args.endDate));
      return { success: true, transactions: result };
    }
    
    case 'get_spending_insights': {
      const allTransactions = Array.from(transactions.values()).filter(t => t.type === 'expense');
      const byCategory: Record<string, number> = {};
      
      allTransactions.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });
      
      const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
      
      return {
        success: true,
        insights: {
          totalSpent: allTransactions.reduce((sum, t) => sum + t.amount, 0),
          byCategory,
          topSpendingCategory: topCategory ? topCategory[0] : 'None',
          transactionCount: allTransactions.length,
        }
      };
    }
    
    case 'add_transaction': {
      const transaction: Transaction = {
        id: generateId(),
        description: args.description,
        amount: Math.abs(args.amount),
        date: new Date(),
        category: args.category || 'Other',
        type: args.type,
      };
      transactions.set(transaction.id, transaction);
      
      // Update budget spent
      if (args.type === 'expense') {
        const budget = Array.from(budgets.values()).find(b => b.category === args.category);
        if (budget) {
          budget.spent += Math.abs(args.amount);
        }
      }
      
      return { success: true, transaction };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

// ============ SERVER SETUP ============

const server = new Server(
  {
    name: 'ai-ecommerce-suite',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const result = await handleToolCall(name, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: String(error) }) }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AI E-commerce Suite MCP Server running on stdio');
}

main().catch(console.error);
