import { saveToFav, saveToCart } from "./cfunc.js";
import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
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

const getUserFav = async () => {
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

  return responce?.user?.fav;
};

const productId = location.href.split("?id=")[1];

function returnStars(num) {
  let retVal = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= num) {
      retVal += `<i class="fa-solid fa-star"></i>`;
    } else {
      retVal += `<i class="fa-regular fa-star"></i>`;
    }
  }

  return retVal;
}

const product = document.querySelector(".main-product");
const addQty = product.querySelector(".product-info .qty .add");
const reduceQty = product.querySelector(".product-info .qty .reduce");
const qtyNum = product.querySelector(".product-info .qty span");


const updateInfo = async () => {
  const product = (await getProductByIdAPI(productId))?.data;
  const allImgs = []
  const allFav = await getUserFav();

  if (Object.keys(product || {}).length<=0) {
    document.querySelector(".main-product").innerHTML = "<h1>Sorry No Product Found</h1>"
    return;
  }

  for(let img of product.product_imgs) {
    if(img !== "") allImgs.push(img);
  }

  const mainImg = document.querySelector(".main-image img")
  mainImg.src = allImgs[0];

  const navigate = document.querySelector(".main-product .navigate");
  for(let img of allImgs) {
    const container = document.createElement("div");
    container.classList.add("container");
    container.innerHTML = `<img src="${img}" alt="other images">`;

    container.addEventListener("click", () => {
      const active = document.querySelector(".navigate .active");
      active?.classList.remove("active");
      container.classList.add("active");
      mainImg.setAttribute("src", container.querySelector("img").src);
    });

    navigate.appendChild(container);
  }

  navigate.querySelector(".container").classList.add("active");

  document.title = product.title;
  document.querySelector(".qty-left span").innerHTML = product.qty;
  document.querySelector(".main-product .title").innerHTML = product.title;
  document.querySelector(".main-product .desc").innerHTML = product.description;
  document.querySelector(".main-product .box .price").innerHTML = "₹ " + numeral(product.price).format("0,0");
  document.querySelector(".main-product .reviews").innerHTML = `<div class="stars">${returnStars(product.stars)}</div>
  <span>(${product.review_count})</span>`

  qtyNum.innerText = product.qty>=1?1:0

  const favBtn = document.querySelector(".main-product .favourite");
  favBtn.addEventListener("click", () => {
    if (favBtn.classList.contains("active")) {
      favBtn.innerHTML = "Add To Favourite";
      saveToFav(favBtn, productId);
    }else {
      saveToFav(favBtn, productId);
      favBtn.innerHTML = "Already Favourite";
    }
  })

  if (allFav.indexOf(productId) >= 0){
    favBtn.classList.add("active");
    document.querySelector(".main-product .favourite").innerHTML = "Already Favourite"
  }

  const cartBtn = document.querySelector(".main-product .cart");
  cartBtn.addEventListener("click", () => {
    if (product.qty === 0)  {
      alert("Product Out of Stock")
      return
    }
    saveToCart(productId, parseInt(qtyNum.innerText))
  });
}

updateInfo();



addQty.addEventListener("click", () => {
  const currentQty = parseInt(qtyNum.innerText);
  const availableQty = parseInt(document.querySelector(".qty-left span").innerHTML);

  if (availableQty === 0) return
  if (currentQty < 10 && availableQty-currentQty >= 1) {
    qtyNum.innerText = currentQty + 1;
  }
});

reduceQty.addEventListener("click", () => {
  const currentQty = parseInt(qtyNum.innerText);
  const availableQty = parseInt(document.querySelector(".qty-left span").innerHTML);

  if (availableQty === 0) return
  if (currentQty > 1) {
    qtyNum.innerText = currentQty - 1;
  }
});