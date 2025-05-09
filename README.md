# Peeentrest - Pinterest Clone with Payment Integration and Mother's Day Theme

## Project Overview

Peeentrest is a Pinterest-inspired web application that allows users to upload images, add descriptions, and organize them on a personal board with drag-and-drop functionality. This project has been enhanced with a secure payment system integration using Stripe and PayPal, enabling users to purchase images directly from the board.

The UI features a subtle dark ruby red theme with Mother's Day elements, including a hidden message and decorative accents, making it a heartfelt gift application.

## Features

- Upload images with optional descriptions (auto-extracted from image metadata or AI-generated if missing).
- Organize images on a personal board with drag-and-drop.
- Shopping cart with quantity management and real-time total calculation.
- Secure checkout with Stripe and PayPal payment gateways.
- Export and import photos as ZIP files with descriptions.
- Responsive and accessible design with a warm Mother's Day theme.

## Installation and Running

### Prerequisites

- Node.js (v14 or higher)
- npm (Node package manager)

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd peeentrest-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set environment variables for Stripe and PayPal API keys:

   ```bash
   export STRIPE_SECRET_KEY=your_stripe_secret_key
   export PAYPAL_CLIENT_ID=your_paypal_client_id
   export PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   ```

4. Start the backend server:

   ```bash
   npm start
   ```

### Frontend Setup

1. Serve the frontend files using a simple HTTP server (e.g., Python):

   ```bash
   python3 -m http.server 2442 -d peeentrest
   ```

2. Open your browser and navigate to:

   ```
   http://localhost:2442/index.html
   ```

## Data Flow

- Users upload images with optional descriptions.
- If no description is provided, the app extracts metadata from the image or generates a description using AI logic.
- Images and metadata are stored in browser localStorage.
- Users add images to the shopping cart with quantity management.
- At checkout, the app communicates with the backend to create payment intents/orders with Stripe or PayPal.
- Payment status is confirmed via backend webhooks and reflected in the frontend UI.
- Users can export/import their photo collections as ZIP files.

## Changelog

### v1.0.0 - Initial Release

- Pinterest clone with image upload, drag-and-drop board, and localStorage persistence.
- Export/import photos as ZIP files.
- Responsive design with Mother's Day theme.

### v1.1.0 - Payment Integration and UI Enhancements

- Added secure payment system with Stripe and PayPal.
- Implemented shopping cart with quantity management.
- Enhanced UI with dark ruby red theme and Mother's Day decorative elements.
- Added metadata extraction and AI-generated descriptions for images without captions.
- Improved error handling and user feedback.
- Added hidden Mother's Day message and subtle background decorations.

---

This README provides all necessary information to install, run, and understand the Peeentrest project with payment integration and themed UI enhancements.
