let totalSavings = 0;

function addSavings() {

    let amount = Number(document.getElementById("amount").value);

    if (amount <= 0) {
        alert("Please enter an amount.");
        return;
    }

    totalSavings = totalSavings + amount;

    document.getElementById("total").innerHTML =
        "₱" + totalSavings.toFixed(2);

    document.getElementById("amount").value = "";
}

function resetSavings() {

    totalSavings = 0;

    document.getElementById("total").innerHTML = "₱0.00";
}