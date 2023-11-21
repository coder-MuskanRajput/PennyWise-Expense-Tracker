const balance = document.getElementById("balance");
const money_plus= document.getElementById("money_plus");
const money_minus= document.getElementById("money_minus");
const list = document.getElementById("list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");
const tags = document.getElementById("tags");
const category = document.getElementById("category");

const dummyTransactions = [
    {
        
    }
]

let Transactions = dummyTransactions;

function addTranactionDOM(transactions){
    const sign = transactions.amount< 0 ? "-":"+";
    const item = document.createElement("Li");

item.classList.add(
    transactions.amount < 0 ? "minus" : "plus");

item.innerHTML =`${transactions.text}<span> ${sign}${Math.abs(transactions.amount)} </span>`

list.appendChild(item);
}

addTranactionDOM(Transactions)

