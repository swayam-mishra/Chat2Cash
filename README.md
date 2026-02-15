# Chat2Cash 

> **AI-powered revenue recovery system for India's WhatsApp-first businesses.**
> 
> _Transforming messy chat logs into structured orders, invoices, and business intelligence._

## The Story Behind Chat2Cash

**60 million SMBs in India run their businesses on WhatsApp.** But WhatsApp is a chat app, not an operating system.

I built this project watching my mother run her clothing business. Every day, she would lose 10-15% of her potential revenue because orders got buried in chat threads, follow-ups were forgotten, and payments were missed. Manual entry into Excel at 11 PM was the only solution—until now.

**Chat2Cash is an AI operations layer that sits on top of WhatsApp.** It automatically reads messy "Hinglish" conversations, extracts structured order details, and generates GST-compliant invoices in one click.

---

## Features

### 1. AI Order Extraction

- **Multilingual Support**: Understands English, Hindi, and "Hinglish" (e.g., _"2 kilo aloo"_).
    
- **Context Aware**: Distinguishes between polite addresses ("Bhaiya", "Didi") and actual customer names.
    
- **Smart Parsing**: Extracts items, quantities, units, and delivery dates from unstructured text.
    

### 2. Instant Invoicing

- **One-Click Generation**: Converts extracted chat data into professional invoices.
    
- **GST Compliant**: Automatically calculates CGST/SGST breakdowns.
    
- **Shareable**: Generates formats ready to be sent back to the customer on WhatsApp.
    

### 3. Business Dashboard

- **Revenue Tracking**: Real-time view of daily/weekly sales.
    
- **Payment Status**: Track Pending vs. Paid orders to prevent revenue leakage.
    
- **Recent Activity**: A clear feed of all incoming orders and their fulfillment status.
    

---

## Tech Stack

- **Frontend**: React (TypeScript), Vite, Tailwind CSS, shadcn/ui
    
- **Backend**: Node.js, Express
    
- **AI Engine**: Anthropic Claude 3.5 Sonnet (via API)
    
- **Data Validation**: Zod
    
- **State Management**: React Hooks & Context
    

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
    
- npm or yarn
    
- An **Anthropic API Key** (for Claude AI)
    

### Installation

1. **Clone the repository**
    
    Bash
    
    ```
    git clone https://github.com/yourusername/chat2cash.git
    cd chat2cash
    ```
    
2. **Install dependencies**
    
    Bash
    
    ```
    npm install
    ```
    
3. **Configure Environment Variables**
    
    Create a `.env` file in the root directory and add your Anthropic API key:
    
    Code snippet
    
    ```
    ANTHROPIC_API_KEY=sk-ant-api03-...
    ```
    
4. **Run the Application**
    
    Bash
    
    ```
    npm run dev
    ```
    
    The server will start on port 5000.
    
    Open [http://localhost:5000](https://www.google.com/search?q=http://localhost:5000) to view the app.
    

---

## Project Structure

Bash

```
chat2cash/
├── client/                 # Frontend Application
│   ├── src/
│   │   ├── components/     # UI Components (ChatSimulator, Dashboard, etc.)
│   │   └── lib/            # Utilities and API clients
├── server/                 # Backend Application
│   ├── routes.ts           # API Routes definitions
│   ├── anthropic.ts        # AI Logic & Prompt Engineering
│   └── storage.ts          # In-memory database (mock)
├── shared/                 # Shared Types
│   └── schema.ts           # Zod schemas for validation
└── chats/                  # Sample chat logs for testing
```

---

## API Endpoints

The backend provides the following REST endpoints:

- `POST /api/extract-order`: Takes a raw chat message/log and returns structured JSON.
    
- `POST /api/generate-invoice`: Generates invoice details from a confirmed order.
    
- `GET /api/orders`: Retrieves all stored orders.
    
- `GET /api/stats`: Returns dashboard analytics (revenue, order counts).
    

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
    
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
    
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
    
4. Push to the Branch (`git push origin feature/AmazingFeature`)
    
5. Open a Pull Request
    

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

_Built with ❤️ for the 60 million SMBs of India._