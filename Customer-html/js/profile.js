import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

async function getInfoAPI() {
  const request = await fetch(host + "/user?token=" + token, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "application/json",
    },
  });

  if (!request.ok) {
    window.location.href = "/login.html";
    return;
  }

  const responce = await request.json();

  if (!responce.success) {
    alert(responce.msg);
    window.location.href = "/login.html";
    return;
  }
  return responce;
}

async function getAllOrdersAPI(status = "") {
  const request = await fetch(host + "/orders?token=" + token + "&status=" + status, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "application/json",
    },
  });

  if (!request.ok) {
    window.location.href = "/login.html";
    return;
  }

  const responce = await request.json();

  if (!responce.success) {
    alert(responce.msg);
    window.location.href = "/login.html";
    return;
  }

  return responce?.data;
}

const getProductByIdAPI = async (pid) => {
  const request = await fetch(host + "/product?product_id=" + pid);

  if (!request.ok) {
    window.location.href = "/login.html";
    return;
  }

  const responce = await request.json();

  if (!responce.success) {
    alert(responce.msg);
    window.location.href = "/login.html";
    return;
  }

  return responce?.data;
};


const getOrderByIdAPI = async (id) => {
  const request = await fetch(host + "/orders/id?token=" + token + "&order_id=" + id);

  if (!request.ok) {
    window.location.href = "/login.html";
    return;
  }

  const responce = await request.json();

  if (!responce.success) {
    alert(responce.msg);
    window.location.href = "/login.html";
    return;
  }

  return responce.data;
}


const ordersContainer = document.querySelector(".user-orders .body")
const orderPopup = document.querySelector(".order-popup");

const Status = {
  0: "pending",
  1: "processing",
  2: "delivered",
  3: "cancelled"
}

const months = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec"
}


let FILTERS = "all"

async function updateProfileVIEW() {
  const responce = await getInfoAPI();
  document.querySelector(".name").innerHTML = responce.user.name;
  document.querySelector(".mobile").innerHTML = "+91 " + responce.user.number;
  document.querySelector(".location").innerHTML = responce.user.location;
  document.querySelector(".email").innerHTML = responce.user.email;
  document.querySelector(".user-profile img").src = responce.user.profile_url || "https://ik.imagekit.io/imdfhuoko/tr:h-250/user_scVChk2I5.jpg";
}

async function updateOrdersVIEW() {
  const allOrders = await getAllOrdersAPI(FILTERS==="all"?"":FILTERS);

  if(allOrders.length <= 0){
    ordersContainer.innerHTML = "<h1>No Orders Found</h1>";
    return;
  }

  ordersContainer.innerHTML = "";
  for (let order of allOrders) {
    const productInfo = await getProductByIdAPI(order.product_id);
    let firstImg = ""
    for (let img of productInfo.product_imgs){
      if (img !== ""){
        firstImg = img;
        break;
      }
    }

    const orderElm = document.createElement("div");
    orderElm.classList.add("order");
    
    orderElm.innerHTML = `<img src="${firstImg}" alt="img">
    <div class="info">
        <p class="product-name">${productInfo.title}</p>
        <p class="status">Status <span class="${Status[order.status]}">${Status[order.status]}</span></p>
    </div>

    <p class="price">₹ <span>${numeral(order.total_amount).format("0,0")}</span></p>`

    orderElm.addEventListener("click", () => {
      updateOrderPopup(order);
      orderPopup.classList.add("active");
    });

    ordersContainer.appendChild(orderElm);
  }
}

const updateOrderPopup = async (order)  => {
  const orderInfo = await getOrderByIdAPI(order.id);
  const product = await getProductByIdAPI(order.product_id);
  document.querySelector(".order-num span").innerHTML = "#" + order.id;
  const splitDate = orderInfo.date.split("-");
  document.querySelector(".popup-date span").innerHTML = `${splitDate[2]} ${months[parseInt(splitDate[1])]} ${splitDate[0]}`;

  let firstImg = ""
  for (let img of product.product_imgs){
    if (img !== ""){
      firstImg = img;
      break;
    }
  }

  document.querySelector(".popup-image img").src = firstImg;
  document.querySelector(".popup-image a").href = `/product.html?id=${order.product_id}`;
  document.querySelector(".popup-title").innerHTML = product.title;
  document.querySelector(".popup-desc").innerHTML = product.description;
  document.querySelector(".popup-qty").innerHTML = "Qty: " + order.qty;
  
  const popupStatus = document.querySelector(".popup-status span");
  popupStatus.className = popupStatus.innerHTML = Status[order.status];
  
  const price = document.querySelector(".charge.price");
  const shipping = document.querySelector(".charge.shipping");
  const discount = document.querySelector(".charge.discount");
  const tax = document.querySelector(".charge.tax");
  const total_amount = document.querySelector(".charge.final");

  price.querySelector(".charge-desc").innerHTML = `Price (₹ ${numeral(product.price).format("0,0")} X ${order.qty})`;
  price.querySelector(".charge-value").innerHTML = "₹ " + numeral(product.price * order.qty).format("0,0");

  shipping.querySelector(".charge-value").innerHTML = "+ ₹ " + numeral(orderInfo.shipping).format("0,0");

  discount.querySelector(".charge-desc").innerHTML = `Discount (${orderInfo.discount}%)`;
  discount.querySelector(".charge-value").innerHTML = "- ₹ " + numeral(((product.price*order.qty)/100)*orderInfo.discount).format("0,0");

  tax.querySelector(".charge-desc").innerHTML = `Tax (${orderInfo.tax}%)`;
  tax.querySelector(".charge-value").innerHTML = "+ ₹ " + numeral(((product.price*order.qty)/100)*orderInfo.tax).format("0,0");

  total_amount.querySelector(".charge-value").innerHTML = "+ ₹ " + numeral(order.total_amount).format("0,0");
}

const sortBtn = document.querySelector(".user-orders .sort");
const dropMenu = sortBtn.querySelector(".drop-menu");

sortBtn.addEventListener("click", (e) => {
  if (!e.target.classList.contains("drop-menu") && !e.target.classList.contains("item")) {
    dropMenu.classList.toggle("active");
  }
});

dropMenu.querySelectorAll(".item").forEach((item) => {
  item.addEventListener("click", () => {
    const value = item.dataset.value;
    sortBtn.querySelector(".selected").className = `selected ${item.classList[1]}`;
    sortBtn.querySelector(".selected").innerText = item.innerText;
    FILTERS = value;
    ordersContainer.innerHTML = '<img class="loading" src="https://ik.imagekit.io/imdfhuoko/loading_EVWALDndS.gif?ik-sdk-version=javascript-1.4.3&updatedAt=1661905107346" alt="loading">';
    updateOrdersVIEW();
    dropMenu.classList.remove("active");
  });
});

// const allUserOrders = document.querySelectorAll(".user-orders .order");
// allUserOrders.forEach((order) => {
//   order.addEventListener("click", () => {
//     orderPopup.classList.add("active");
//   });
// });

orderPopup.querySelector(".popup-back").addEventListener("click", () => {
  orderPopup.classList.remove("active");
});

async function displayPopup() {
  const responce = await getInfoAPI();
  document.querySelector("#name").value = responce.user.name;
  document.querySelector("#mobile").value = responce.user.number;
  document.querySelector("#location").value = responce.user.location;
  document.querySelector(".updater-img").src =
    responce.user.profile_url ||
    "https://ik.imagekit.io/imdfhuoko/tr:h-250/user_scVChk2I5.jpg";
  document.querySelector("#image").value = responce.user.profile_url;
}

async function logoutAPI() {
  const request = await fetch(host + "/user/logout?token=" + token);

  if (!request.ok) {
    window.location.href = "/login.html";
    return;
  }

  const responce = await request.json();

  if (!responce.success) {
    alert(responce.msg);
    window.location.href = "/login.html";
    return;
  }

  window.location.href = "/";
}

const logoutBtn = document.querySelector(".logout");
logoutBtn.addEventListener("click", () => {
  const conf = confirm("Are you sure you want to logout?");
  if (conf) {
    localStorage.removeItem("token");
    logoutAPI();
  }
});

async function updateInfoAPI(name, number, location, profile_url) {
  const request = await fetch(host + "/user", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      number,
      location,
      profile_url,
      token: localStorage.getItem("token"),
    }),
  });

  if (!request.ok) {
    window.location.href = "/login.html";
    return;
  }

  const responce = await request.json();

  if (!responce.success) {
    alert(responce.msg);
    window.location.href = "/login.html";
    return;
  }

  updateProfileVIEW();
}

const profileEditMenu = document.querySelector(".profile-edit-menu");
const saveProfile = profileEditMenu.querySelector(".save-profile");
const cancelProfile = profileEditMenu.querySelector(".cancel-profile");
const editProfileBtn = document.querySelector(".user-profile .edit-profile");

editProfileBtn.addEventListener("click", () => {
  displayPopup();
  profileEditMenu.classList.add("active");
});

saveProfile.addEventListener("click", async () => {
  const name = document.querySelector("#name").value;
  const mobile = document.querySelector("#mobile").value;
  const location = document.querySelector("#location").value;
  const image = document.querySelector("#image").value;
  await updateInfoAPI(name, mobile, location, image);
  profileEditMenu.classList.remove("active");
});

cancelProfile.addEventListener("click", () => {
  profileEditMenu.classList.remove("active");
});


updateProfileVIEW();
updateOrdersVIEW()