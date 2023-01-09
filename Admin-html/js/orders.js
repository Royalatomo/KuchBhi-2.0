import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

const statusCode = {
  0: "pending",
  1: "processing",
  2: "completed",
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

const getAllOrdersAPI = async (email = "", status = "") => {
  const request = await fetch(host + "/orders?token=" + token + "&email=" + email + "&status=" + status, {
    method: "GET",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "application/json",
    }
  });

  if (!request.ok) {
    return;
  }

  const responce = await request.json();
  if (!responce.success) {
    alert(responce.msg);
    return;
  }

  return responce;
}

const getOrderByIdAPI = async (id) => {
  const request = await fetch(host + "/orders/id?token=" + token + "&order_id=" + id);

  if (!request.ok) {
    return;
  }

  const responce = await request.json();
  if (!responce.success) {
    alert(responce.msg);
    return;
  }

  return responce.data;
}

const getProductByIdAPI = async (pid) => {
  const request = await fetch(host + "/product?product_id=" + pid);

  if (!request.ok) {
    return;
  }

  const responce = await request.json();
  if (!responce.success) {
    alert(responce.msg);
    return;
  }

  return responce.data;
};

const getCustomerByEmailAPI = async (email) => {
  const request = await fetch(host + "/user?token=" + token + "&email=" + email);
  
  if (!request.ok) {
    return;
  }

  const responce = await request.json();
  if (!responce.success) {
    alert(responce.msg);
    return;
  }

  return responce.user;
};

const orderStatusAPI = async (order_id, status) => {
  const request = await fetch(host + "/orders", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({order_id, status, token}),
  });

  if (!request.ok) {
    return;
  }

  const responce = await request.json();
  if (!responce.success) {
    alert(responce.msg);
    return;
  }
};

const ordersContainer = document.querySelector(".orders-container");
const orderPopup = document.querySelector(".order-popup");
orderPopup.querySelector(".popup-back").addEventListener("click", () => {
  orderPopup.classList.remove("active");
});


const updateOrderInfoVIEW = async (id) => {
  const orderInfo = await getOrderByIdAPI(id);
  const productInfo = await getProductByIdAPI(orderInfo.product_id);
  const customerInfo = await getCustomerByEmailAPI(orderInfo.customer_email);

  orderPopup.querySelector(".order-num span").innerHTML = "#" + orderInfo.id
  const splitDate = orderInfo.date.split("-");
  orderPopup.querySelector(".popup-date span").innerHTML = `${splitDate[2]} ${months[parseInt(splitDate[1])]} ${splitDate[0]}`
  
  let firstImg = ""
  for (let img of productInfo.product_imgs){
    if (img !== ""){
      firstImg = img;
      break;
    }
  }

  orderPopup.querySelector(".popup-image img").src = firstImg;
  orderPopup.querySelector(".popup-image a").href = "/product?id=" + orderInfo.product_id;
  orderPopup.querySelector(".popup-title").innerHTML = productInfo.title
  orderPopup.querySelector(".popup-desc").innerHTML = productInfo.description
  orderPopup.querySelector(".popup-qty span").innerHTML = orderInfo.qty
  orderPopup.querySelector(".popup-status span").innerHTML = statusCode[orderInfo.status]
  
  orderPopup.querySelector(".popup-item.name span").innerHTML = customerInfo.name
  orderPopup.querySelector(".popup-item.mobile span").innerHTML = "+91 " + customerInfo.number
  orderPopup.querySelector(".popup-item.address span").innerHTML = customerInfo.location
  orderPopup.querySelector(".popup-item.email span").innerHTML = customerInfo.email
  
  const priceName = orderPopup.querySelector(".charge.price .charge-desc");
  priceName.innerHTML = `Price (₹ ${numeral(productInfo.price).format("0,0")} X ${orderInfo.qty})`;
  
  const totalPrice =parseInt(productInfo.price)*parseInt(orderInfo.qty);
  orderPopup.querySelector(".charge.price .charge-value").innerHTML = `₹ ${numeral(totalPrice).format("0,0")}`;

  const shipping = orderInfo.shipping?"+ ₹ "+numeral(orderInfo.shipping).format("0,0"):"Free";
  orderPopup.querySelector(".charge.shipping .charge-value").innerHTML = shipping;
  
  const discount = (totalPrice*parseInt(orderInfo.discount))/100;
  const discountName = orderPopup.querySelector(".charge.discount .charge-desc");
  discountName.innerHTML = `Discount (${orderInfo.discount}%)`
  orderPopup.querySelector(".charge.discount .charge-value").innerHTML = `- ₹ ${numeral(discount).format("0,0")}`;
  
  const tax = (totalPrice*parseInt(orderInfo.tax))/100;
  const taxName = orderPopup.querySelector(".charge.tax .charge-desc");
  taxName.innerHTML = `Tax (${orderInfo.tax}%)`
  orderPopup.querySelector(".charge.tax .charge-value").innerHTML = `+ ₹ ${numeral(tax).format("0,0")}`;
  
  const netValue = totalPrice+tax+orderInfo.shipping-discount
  orderPopup.querySelector(".charge.total .charge-value").innerHTML = `₹ ${numeral(netValue).format("0,0")}`;
  
  const totalRev = totalPrice-discount;
  const revenueName = orderPopup.querySelector(".charge.revenue .charge-desc");
  revenueName.innerHTML = `Revenue (${numeral(totalPrice).format("0,0")} - ${numeral(discount).format("0,0")})`
  orderPopup.querySelector(".charge.revenue .charge-value").innerHTML = `₹ ${numeral(totalRev).format("0,0")}`;

  orderPopup.classList.add("active");
}


const appendOrdersVIEW = async (email = "", status = "", id = "") => {
  let responce = []
  let length = 0
  if (id !== "") {
    const data = await getOrderByIdAPI(id);
    let price = (data['product_price'] * data['qty'])
    let dic = (price/100)*data['discount'];
    data['total_amount'] = price - dic
    responce.push(data);
    length = Object.keys(responce[0]).length;
  }else {
    responce = (await getAllOrdersAPI(email, status)).data;
    length = responce.length;
  }

  ordersContainer.innerHTML = "";
  if (length <= 0) {
    ordersContainer.innerHTML = "<h1 class='not-found'>No Order Found</h1>"
    return;
  }

  for (let order of responce) {
    const productInfo = await getProductByIdAPI(order.product_id);
    let firstImg = ""
    for (let img of productInfo.product_imgs){
      if (img !== ""){
        firstImg = img;
        break;
      }
    }

    const orderElm = document.createElement("div");
    orderElm.setAttribute("class", "order");
    orderElm.innerHTML = `<div class="box">
      <div class="image">
          <img src="${firstImg}" alt="product">
          <p class="qty">Qty: <span>${order.qty}</span></p>
      </div>

      <div class="info">
          <div class="item">
              <p class="tag">Order Id:</p>
              <p class="value red">${order.id}</p>
          </div>
          <div class="item">
              <p class="tag">Email:</p>
              <p class="value blue">${order.customer_email}</p>
          </div>
          <div class="item">
              <p class="tag">Amount:</p>
              <p class="value green">₹ ${numeral(order.total_amount).format("0,0")}</p>
          </div>
      </div>
    </div>

    <select class="status pen">
        <option value="0" class="op-blue">Pending</option>
        <option value="1" class="op-orange">Processing</option>
        <option value="2" class="op-green">Completed</option>
        <option value="3" class="op-red">Cancelled</option>
    </select>`

    orderElm.addEventListener("click", (e) => {
      const tCl = e.target.classList;
      const pCl = e.target.parentElement.classList;
      if (tCl.contains("status") || pCl.contains("status")) {
        return false;
      }
      
      updateOrderInfoVIEW(order.id)
    });

    const status = orderElm.querySelector(".status")
    status.addEventListener("change", async (e) => {
      const value = statusCode[e.currentTarget.value].slice(0, 3);
      status.className = `status ${value}`;

      await orderStatusAPI(order.id, e.currentTarget.value);
    });
    status.querySelectorAll("option")[order.status].selected = 'selected';
    status.className = `status ${statusCode[order.status].slice(0, 3)}`;

    ordersContainer.appendChild(orderElm);
  }
}


const searchInput = document.querySelector(".search-box input");
const searchIcon = document.querySelector(".search-box i");
const filters = document.querySelector(".sorting");

searchIcon.addEventListener("click", () => {
  const value = searchInput.value;
  if (value.length == 0) {
    appendOrdersVIEW("", filters.value);
  }
  else if (value.indexOf("@") > -1) {
    appendOrdersVIEW(value, filters.value);
  }else{
    appendOrdersVIEW("", filters.value, value);
  }
})


const emailToSearch = window.location.href.split("?email=")[1]
if (emailToSearch){
  searchInput.value = emailToSearch
  searchIcon.click();
}else {
  appendOrdersVIEW()
}


filters.addEventListener("change", () => {
  const value = searchInput.value;
  if (value.indexOf("@") > -1) {
    appendOrdersVIEW(searchInput.value, filters.value, "");
  }else {
    appendOrdersVIEW("", filters.value, "");
  }
})