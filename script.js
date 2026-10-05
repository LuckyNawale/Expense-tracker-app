console.log("Expense tracker started");

let addButton = document.getElementById("addButton");

addButton.addEventListener("click", function(){
    console.log("Button clicked");
        
})

function calculateTotal(amount1, amount2){
    return amount1 + amount2
}
let total = calculateTotal(200, 300);
console.log(total);





console.log("Expense tracker ended");
