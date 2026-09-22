function loadCart() {
  const cart = JSON.parse(localStorage.getItem("nexusCart")) || [];
  const container = document.getElementById("cartContainer");
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML =
      "<p>Your wardrobe is empty. Discover iconic pieces and elevate your style.</p>";
    document.getElementById("cartTotal").innerText = "0";
    return;
  }

  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;

    container.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}" width="80">
        <div>
          <h3>${item.name}</h3>
          <p>₹${item.price}</p>
          <div>
            <button onclick="changeQty(${item.id}, -1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="changeQty(${item.id}, 1)">+</button>
            <button onclick="removeItem(${item.id})">Remove</button>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById("cartTotal").innerText = total;
}

function changeQty(id, change) {
  let cart = JSON.parse(localStorage.getItem("nexusCart")) || [];
  const item = cart.find(p => p.id === id);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(p => p.id !== id);
  }

  localStorage.setItem("nexusCart", JSON.stringify(cart));
  loadCart();
}

function removeItem(id) {
  let cart = JSON.parse(localStorage.getItem("nexusCart")) || [];
  cart = cart.filter(p => p.id !== id);
  localStorage.setItem("nexusCart", JSON.stringify(cart));
  loadCart();
}

function proceedToCheckout() {
  console.log("Checkout clicked");
  const cart = JSON.parse(localStorage.getItem("nexusCart")) || [];

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
  });

  const orders = JSON.parse(localStorage.getItem("nexusOrders")) || [];

  const newOrder = {
    orderId: "ORD" + Math.floor(Math.random() * 1000000),
    date: new Date().toLocaleDateString(),
    total: total,
    items: cart,
    status: "Processing"
  };


  orders.push(newOrder);

  localStorage.setItem("nexusOrders", JSON.stringify(orders));
  localStorage.removeItem("nexusCart");

  alert("Order placed successfully!");
  window.location.href = "index1.html";
}

loadCart();
