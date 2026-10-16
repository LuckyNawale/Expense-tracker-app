# Spendwise — Expense Tracker

A responsive, browser-based expense tracker for keeping everyday spending organized. Add an expense with a name, amount, category, and date; review your totals; and search or filter your transaction history.

## Features

- Dashboard totals for all expenses and the current month
- Categorized spending breakdown
- Search and filter recent transactions
- Edit expense names, amounts, categories, and dates
- Delete expenses with a confirmation step
- Automatic saving in the browser with `localStorage`
- Responsive layout for desktop, tablet, and mobile screens
- Indian rupee formatting

## Run locally

Open `index.html` in a modern browser. No build tools or dependencies are required. For the most reliable browser storage behavior, you can also serve this folder with a local static web server.

Expenses stay in the browser on the current device; they are not uploaded to a server or synchronized between devices. Clearing the browser's site data removes saved expenses.

## Project files

- `index.html` — accessible page structure
- `style.css` — responsive visual design
- `script.js` — expense management, summaries, search, filters, and browser storage
