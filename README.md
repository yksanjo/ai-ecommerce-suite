# AI E-commerce Suite 🛒🤖

A collection of AI-powered e-commerce and transaction tools using the Model Context Protocol (MCP).

## Projects Included

### 1. Shopping Sites
AI-powered shopping that searches products, adds to cart, compares items, applies discounts, and completes checkout.

**Tools:**
- `search_products` - Search products by keyword or category
- `add_to_cart` - Add products to shopping cart
- `compare_products` - Compare product features and prices
- `apply_discount` - Find and apply discount codes
- `checkout` - Complete the purchase

### 2. Booking Systems
AI-powered booking that checks availability, makes reservations, and modifies bookings.

**Tools:**
- `check_availability` - Check availability for dates/services
- `create_booking` - Make a new reservation
- `modify_booking` - Change existing reservation details
- `cancel_booking` - Cancel a booking
- `list_bookings` - View all bookings

### 3. Banking/Finance
AI-powered finance management that categorizes transactions, creates budgets, and generates reports.

**Tools:**
- `categorize_transaction` - Auto-categorize transactions
- `create_budget` - Set up budget categories
- `generate_report` - Create financial reports
- `list_transactions` - View transaction history
- `get_spending_insights` - Analyze spending patterns

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yksanjo/ai-ecommerce-suite.git

# Install dependencies
cd ai-ecommerce-suite
npm install

# Run the MCP server
npm start
```

## MCP Server Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "ai-ecommerce-suite": {
      "command": "node",
      "args": ["/path/to/ai-ecommerce-suite/dist/server.js"]
    }
  }
}
```

## Architecture

- **Read-Only Tools**: Use `readOnlyHint: true` for search/query operations
- **State-Modifying Tools**: Require user confirmation before execution
- **Multi-Step Workflows**: Chain tools for complex tasks

## Badge

[![MCP Server](https://img.shields.io/badge/MCP%20Server-Ready-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
