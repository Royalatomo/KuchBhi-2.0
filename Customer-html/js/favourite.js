import { host } from "./env.js";
import { saveToFav, saveToCart } from "./cfunc.js";

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

const holder = document.querySelector(".products-area");

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

const appendProductVIEW = async () => {
  const fav = (await getInfoAPI()).user.fav;
  const products = [];

  for (let item of fav) {
    const productApi = (await getProductByIdAPI(item)).data;
    productApi['id'] = item;
    products.push(productApi);
  }

  holder.innerHTML = "";

  for (let product of products) {
    const productElm = document.createElement("div");
    productElm.setAttribute("class", "product");

    let firstImg = "";
    for (let img of product.product_imgs) {
      if (img !== "") {
        firstImg = img;
        break;
      }
    }

    productElm.innerHTML = `
    <a href="/product.html?id=${product.id}" class="product-head">
      <img src="${firstImg}" alt="${product.title}">
    </a>
    <span class="fav active"><i class="fa-solid fa-heart"></i></span>

    <div class="product-body">
        <div class="desc">
            <h4 class="title">${product.title}</h4>
            <p class="info">${product.description}</p>
            <div class="reviews">
                <div class="stars">${returnStars(product.stars)}</div>
                <span>(${product.review_count})</span>
            </div>
        </div>

    </div>
    <div class="product-foot">
        <button class="cart">Add To Cart</button>
        <p class="price"><sup>₹</sup>${numeral(product.price).format("0,0")}</p>
    </div>`;

    const productFav = productElm.querySelector(".fav");
    productFav.addEventListener("click", () => {
      saveToFav(productFav, product.id);
    });

    const productCart = productElm.querySelector(".cart");
    productCart.addEventListener("click", () => {
      saveToCart(product.id);
    });

    holder.appendChild(productElm);
  }

  if (holder.innerHTML === "") {
    holder.innerHTML = "<h1>Nothing</h1>";
  }
};

appendProductVIEW();