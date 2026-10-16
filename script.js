"use strict";

const STORAGE_KEY = "spendwise.expenses.v1";
const CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

const CATEGORY_STYLES = {
  "Food & Dining": { icon: "🍜", color: "#efa45f" },
  Transport: { icon: "🚕", color: "#6998e8" },
  Shopping: { icon: "🛍️", color: "#af80dc" },
  "Bills & Utilities": { icon: "💡", color: "#e8b84e" },
  Entertainment: { icon: "🎬", color: "#e47d8a" },
  Health: { icon: "🌿", color: "#57b698" },
  Education: { icon: "📚", color: "#6f91d9" },
  Other: { icon: "✦", color: "#8e91a6" },
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const form = document.getElementById("addExpenseForm");
const nameInput = document.getElementById("expenseName");
const amountInput = document.getElementById("expenseAmount");
const categoryInput = document.getElementById("expenseCategory");
const dateInput = document.getElementById("expenseDate");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const expenseList = document.getElementById("expenseList");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");

let expenses = loadExpenses();
let toastTimer;

function todayAsInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidExpense(expense) {
  return (
    expense !== null &&
    typeof expense === "object" &&
    typeof expense.id === "string" &&
    typeof expense.name === "string" &&
    expense.name.trim().length > 0 &&
    Number.isFinite(expense.amount) &&
    expense.amount > 0 &&
    CATEGORIES.includes(expense.category) &&
    typeof expense.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(expense.date) &&
    !Number.isNaN(parseLocalDate(expense.date).getTime()) &&
    expense.date === formatDateInputValue(parseLocalDate(expense.date))
  );
}

function loadExpenses() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (storedValue === null) {
      return [];
    }

    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed) || !parsed.every(isValidExpense)) {
      throw new Error("Saved expenses are not in the expected format.");
    }
    return parsed;
  } catch (error) {
    window.setTimeout(() => {
      showToast(
        error instanceof SyntaxError
          ? "Saved expense data could not be read. Add a new expense to get started."
          : "Saved expenses could not be loaded. Your existing data was left untouched.",
        true,
      );
    }, 0);
    return [];
  }
}

function saveExpenses(nextExpenses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextExpenses));
    return true;
  } catch (error) {
    showToast("Could not save your changes. Check your browser storage and try again.", true);
    return false;
  }
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

function expenseDateLabel(value) {
  const date = parseLocalDate(value);
  if (value === todayAsInputValue()) {
    return "Today";
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (value === formatDateInputValue(yesterday)) {
    return "Yesterday";
  }
  return dateFormatter.format(date);
}

function currentMonthExpenses() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  return expenses.filter((expense) => {
    const date = parseLocalDate(expense.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 3200);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function updateCategoryFilter() {
  const selectedCategory = categoryFilter.value;
  const availableCategories = new Set(expenses.map((expense) => expense.category));

  categoryFilter.replaceChildren(new Option("All categories", "all"));
  CATEGORIES.filter((category) => availableCategories.has(category)).forEach((category) => {
    categoryFilter.add(new Option(category, category));
  });
  categoryFilter.value = availableCategories.has(selectedCategory) ? selectedCategory : "all";
}

function renderSummary() {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthTotal = currentMonthExpenses().reduce((sum, expense) => sum + expense.amount, 0);
  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date());

  document.getElementById("totalSpent").textContent = formatCurrency(total);
  document.getElementById("monthSpent").textContent = formatCurrency(monthTotal);
  document.getElementById("expenseCount").textContent = String(expenses.length);
  document.getElementById("monthLabel").textContent = `Spent in ${monthName}`;
}

function renderTransactions() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const selectedCategory = categoryFilter.value;
  const filteredExpenses = expenses
    .filter((expense) => selectedCategory === "all" || expense.category === selectedCategory)
    .filter((expense) =>
      `${expense.name} ${expense.category}`.toLocaleLowerCase().includes(query),
    )
    .sort((first, second) => {
      const dateOrder = second.date.localeCompare(first.date);
      return dateOrder || second.id.localeCompare(first.id);
    });

  expenseList.replaceChildren();
  filteredExpenses.forEach((expense) => {
    expenseList.append(createExpenseRow(expense));
  });

  const hasExpenses = expenses.length > 0;
  emptyState.hidden = filteredExpenses.length > 0;
  expenseList.hidden = filteredExpenses.length === 0;
  document.getElementById("visibleCount").textContent =
    `${filteredExpenses.length} ${filteredExpenses.length === 1 ? "item" : "items"}`;

  if (!hasExpenses) {
    document.getElementById("emptyTitle").textContent = "A fresh start.";
    document.getElementById("emptyMessage").textContent =
      "Add your first expense and your spending story will show up here.";
    document.getElementById("emptyAction").hidden = false;
  } else {
    document.getElementById("emptyTitle").textContent = "No expenses found.";
    document.getElementById("emptyMessage").textContent =
      "Try another search or category to find what you’re looking for.";
    document.getElementById("emptyAction").hidden = true;
  }
}

function createExpenseRow(expense) {
  const style = CATEGORY_STYLES[expense.category];
  const row = createElement("article", "expense-row");
  const icon = createElement("span", "expense-icon", style.icon);
  icon.setAttribute("aria-hidden", "true");

  const details = createElement("div", "expense-details");
  details.append(
    createElement("p", "expense-name", expense.name),
    createElement("p", "expense-meta", `${expense.category} · ${expenseDateLabel(expense.date)}`),
  );

  const amount = createElement("span", "expense-amount", `− ${formatCurrency(expense.amount)}`);
  const deleteButton = createElement("button", "delete-button");
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete ${expense.name}`);
  deleteButton.title = "Delete expense";
  deleteButton.dataset.expenseId = expense.id;
  deleteButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5" /></svg>';

  row.append(icon, details, amount, deleteButton);
  return row;
}

function renderBreakdown() {
  const categoryTotals = new Map();
  expenses.forEach((expense) => {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) || 0) + expense.amount,
    );
  });

  const sortedTotals = [...categoryTotals.entries()].sort((first, second) => second[1] - first[1]);
  const breakdown = document.getElementById("categoryBreakdown");
  const emptyMessage = document.getElementById("breakdownEmpty");
  breakdown.replaceChildren();
  emptyMessage.hidden = sortedTotals.length > 0;
  breakdown.hidden = sortedTotals.length === 0;

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  sortedTotals.forEach(([category, amount]) => {
    const style = CATEGORY_STYLES[category];
    const item = createElement("div", "breakdown-item");
    const name = createElement("span", "breakdown-name");
    const dot = createElement("span", "breakdown-dot");
    dot.style.backgroundColor = style.color;
    dot.setAttribute("aria-hidden", "true");
    name.append(dot, document.createTextNode(category));

    const value = createElement("span", "breakdown-amount", formatCurrency(amount));
    const track = createElement("div", "breakdown-track");
    track.setAttribute("role", "img");
    track.setAttribute("aria-label", `${category}: ${Math.round((amount / total) * 100)}% of spending`);
    const fill = createElement("div", "breakdown-fill");
    fill.style.width = `${Math.max((amount / total) * 100, 2)}%`;
    fill.style.backgroundColor = style.color;
    track.append(fill);
    item.append(name, value, track);
    breakdown.append(item);
  });
}

function render() {
  renderSummary();
  updateCategoryFilter();
  renderTransactions();
  renderBreakdown();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!name) {
    nameInput.setCustomValidity("Enter a name for this expense.");
    nameInput.reportValidity();
    nameInput.setCustomValidity("");
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    amountInput.setCustomValidity("Enter an amount greater than ₹0 and no more than ₹10 crore.");
    amountInput.reportValidity();
    amountInput.setCustomValidity("");
    return;
  }

  const expense = {
    id: window.crypto.randomUUID(),
    name,
    amount,
    category,
    date,
  };
  if (!isValidExpense(expense)) {
    showToast("Please check the expense details and try again.", true);
    return;
  }

  const nextExpenses = [...expenses, expense];
  if (!saveExpenses(nextExpenses)) {
    return;
  }

  expenses = nextExpenses;
  form.reset();
  dateInput.value = todayAsInputValue();
  render();
  nameInput.focus();
  showToast("Expense added. Your totals are up to date.");
});

expenseList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("button[data-expense-id]");
  if (!deleteButton) {
    return;
  }

  const expense = expenses.find((item) => item.id === deleteButton.dataset.expenseId);
  if (!expense || !window.confirm(`Delete "${expense.name}" from your expenses?`)) {
    return;
  }

  const nextExpenses = expenses.filter((item) => item.id !== expense.id);
  if (!saveExpenses(nextExpenses)) {
    return;
  }

  expenses = nextExpenses;
  render();
  showToast("Expense deleted.");
});

searchInput.addEventListener("input", renderTransactions);
categoryFilter.addEventListener("change", renderTransactions);

dateInput.value = todayAsInputValue();
document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date()).toLocaleUpperCase();
render();
