import { host } from "./env.js";
import { saveToCart } from "./cfunc.js";

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

  return responce?.user;
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

  return responce;
};

let DISCOUNT = 0;
let TAX = 0;
let SHIPPING = 0;
let DISCOUNT_CODE = 0;

const getShip_Disc_Info = async (discount_code = "") => {
  const request = await fetch(
    host + "/orders/get-info?token=" + token + "&discount_code=" + discount_code
  );

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

  DISCOUNT = responce.discount;
  TAX = responce.tax;
  SHIPPING = responce.shipping;
};

const itemArea = document.querySelector(".product-area");

const appendItemVIEW = async () => {
  await getShip_Disc_Info();

  const cartItems = (await getInfoAPI()).cart;
  console.log(cartItems);

  if (!cartItems || Object.keys(cartItems).length <= 0) {
    itemArea.innerHTML = "<h1>No cart items</h1>";
  }

  for (let item of cartItems) {
    const id = item["pid"];
    const qty = item["qty"];
    const product = (await getProductByIdAPI(id)).data;

    let firstImg = "";
    for (let img of product.product_imgs) {
      if (img !== "") {
        firstImg = img;
        break;
      }
    }

    const itemElm = document.createElement("div");
    itemElm.classList.add("item");

    itemElm.innerHTML = `
      <button class="close-btn"><i class="fa-solid fa-circle-xmark"></i></button>
      <a href="/product.html?id=${id}" class="item-image">
          <img src="${firstImg}" alt="item-image">
      </a>

      <p class="title">${product.title}</p>
      <div class="box">
          <p class="price"><sup>₹</sup>${numeral(product.price).format(
            "0,0"
          )}</p>
          <div class="qty">
              <i class="fa-solid fa-minus reduce"></i>
              <span>${qty}</span>
              <i class="fa-solid fa-plus add"></i>
          </div>
      </div>`;

    const totalProductLeft = product.qty;
    const qtyNum = itemElm.querySelector(".qty span");
    updatePriceInfo(product.price * qty);

    itemElm.querySelector(".add").addEventListener("click", () => {
      const currentQty = parseInt(qtyNum.innerHTML);
      if (currentQty < 10 && totalProductLeft - currentQty !== 0) {
        qtyNum.innerText = currentQty + 1;
        saveToCart(id, currentQty + 1);
        updatePriceInfo(product.price);
      }
    });

    itemElm.querySelector(".reduce").addEventListener("click", () => {
      const currentQty = parseInt(itemElm.querySelector(".qty span").innerHTML);
      console.log(currentQty);
      if (currentQty > 1) {
        qtyNum.innerText = currentQty - 1;
        saveToCart(id, currentQty - 1);
        updatePriceInfo(-product.price);
      }
    });

    const closeBtn = itemElm.querySelector(".close-btn");
    closeBtn.addEventListener("click", () => {
      updatePriceInfo(-(product.price * parseInt(qtyNum.innerHTML)));
      saveToCart(id, 0);
      itemElm.remove();

      const items = document.querySelectorAll(".product-area .item").length;
      if (items === 0) {
        itemArea.innerHTML = "<h1>No items in cart</h1>";
        updatePriceInfo(0, true);
      }
    });

    itemArea.appendChild(itemElm);
  }
};

appendItemVIEW();

const updatePriceInfo = (price, rest=false) => {
  const item_price = document.querySelector(".charges .item .price");
  const totalPrice = rest?0:numeral(item_price.innerHTML.split("₹")[1]).value();
  item_price.innerHTML = "₹ " + numeral(totalPrice + price).format("0,0");

  const item_shipping = document.querySelector(".charges .item .shipping");
  const totalShipping = rest?0:SHIPPING
  item_shipping.innerHTML = "+ ₹ " + numeral(totalShipping).format("0,0");

  const item_discount = document.querySelector(".charges .item .discount");
  const totalDiscount = ((totalPrice + price) / 100) * DISCOUNT;
  item_discount.innerHTML = "- ₹ " + numeral(totalDiscount).format("0,0");

  const item_tax = document.querySelector(".charges .item .tax");
  const totalTax = ((totalPrice + price) / 100) * TAX;
  item_tax.innerHTML = "+ ₹ " + numeral(totalTax).format("0,0");

  const item_totalAmt = document.querySelector(".total-amt p");
  item_totalAmt.innerHTML =
    "₹ " +
    numeral(totalPrice + price + totalShipping - totalDiscount + totalTax).format(
      "0,0"
    );
};

const promoSubmit = document.querySelector(".coupon-area .submit");
promoSubmit.addEventListener("click", async () => {
  const code = document.querySelector(".coupon-area input").value.toLowerCase();
  if (!code) {
    alert("Code value is empty");
    return;
  }

  await getShip_Disc_Info(code);
  const codeInfo = document.querySelector(".promo-code");

  if (DISCOUNT === 0) {
    alert("Code is invalid");
    updatePriceInfo(0)
    codeInfo.classList.remove("active");
    return;
  }

  DISCOUNT_CODE = code
  codeInfo.classList.add("active");
  codeInfo.querySelector("span").innerHTML = code;

  updatePriceInfo(0)
});

const checkoutBtn = document.querySelector(".payment-area .checkout");

const blackScreen = document.querySelector(".black-screen");
const closeBtn = document.querySelector(".success-msg .close");

const placeOrderAPI = async (product_id, qty) => {
  const request = await fetch(host + "/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id, qty, token, discount_code: DISCOUNT_CODE }),
  });

  if (!request.ok) {
    return;
  }

  const responce = await request.json();
  if (!responce.success) {
    console.log(responce.msg);
    return;
  }
}

checkoutBtn.addEventListener("click", async () => {
  const cartItems = (await getInfoAPI()).cart;

  if(Object.keys(cartItems).length === 0) {
    alert("Your cart is empty");
    return;
  }

  for (let item of cartItems) {
    await placeOrderAPI(item.pid, item.qty);
    saveToCart(item.pid, 0)
  }

  itemArea.innerHTML = "<h1>No items in cart</h1>";
  updatePriceInfo(0, true);
  blackScreen.classList.add("active");
});

closeBtn.addEventListener("click", () => {
  blackScreen.classList.remove("active");
});
