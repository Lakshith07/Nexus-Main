
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB1KPu8CgaeLEstwqWHB6GLkkhUBRUrNGU",
  authDomain: "nexus-rentals-772c5.firebaseapp.com",
  projectId: "nexus-rentals-772c5",
  storageBucket: "nexus-rentals-772c5.firebasestorage.app",
  messagingSenderId: "531412802677",
  appId: "1:531412802677:web:12c22bcd60fa31af1fec3c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    document.getElementById("welcomeText").innerText =
      "Welcome back, " + user.displayName;
  }
});

window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};
function loadOrders() {

  let storedData = localStorage.getItem("nexusOrders");
  let orders = [];

  try {
    const parsed = JSON.parse(storedData);
    if (Array.isArray(parsed)) {
      orders = parsed;
    }
  } catch (e) {
    orders = [];
  }

  const container = document.getElementById("ordersContainer");

  if (!container) {
    console.error("ordersContainer not found");
    return;
  }

  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML =
      "<p>Your luxury journey hasn’t begun yet. Place your first order to unlock exclusive styles.</p>";
    return;
  }

  orders.forEach((order, index) => {

    let status = order.status || "Processing";
    let statusColor = "orange";

    if (status === "Cancelled") statusColor = "red";
    if (status === "Delivered") statusColor = "green";

    let cancelButton = "";

    if (status === "Processing") {
      cancelButton = `
        <button class="cancel-btn" onclick="cancelOrder(${index})">
          Cancel Order
        </button>
      `;
    }

    container.innerHTML += `
      <div style="border:1px solid #eee;padding:20px;margin-bottom:20px;">
        <h3>Order ID: ${order.orderId}</h3>
        <p>Date: ${order.date}</p>
        <p>Total: ₹${order.total}</p>
        <p>Items Ordered: ${order.items ? order.items.length : 0}</p>
        <p>Status: <strong style="color:${statusColor}">${status}</strong></p>
        ${cancelButton}
      </div>
    `;
  });
}


function cancelOrder(index) {
  let orders = JSON.parse(localStorage.getItem("nexusOrders")) || [];

  if (!Array.isArray(orders)) return;

  if (!confirm("Are you sure you want to cancel this order?")) return;

  orders[index].status = "Cancelled";

  localStorage.setItem("nexusOrders", JSON.stringify(orders));

  loadOrders();
}

window.cancelOrder = cancelOrder;



document.addEventListener("DOMContentLoaded", function () {
  loadOrders();
});

