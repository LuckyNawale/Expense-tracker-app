console.log("Expense tracker started");

let addButton = document.getElementById("addButton");

function addExpense(){
    let expenseName = document.getElementById("expenseName").value;
    let expenseAmount = document.getElementById("expenseAmount").value;

    console.log(expenseName);
    console.log(expenseAmount);
}
addButton.addEventListener("click", addExpense)

