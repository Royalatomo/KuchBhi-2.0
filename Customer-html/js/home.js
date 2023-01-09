import { host } from "./env.js";
import { saveToFav, saveToCart } from "./cfunc.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

const bannerImg = document.querySelector(".banner img");
let current = Math.floor(Math.random() * 10) + 1;
bannerImg.src = `/resource/banner-imgs/s${current}.svg`;

setInterval(() => {
  let newImg = Math.floor(Math.random() * 10) + 1;
  while (newImg === current) {
    newImg = Math.floor(Math.random() * 10) + 1;
  }
  bannerImg.src = `/resource/banner-imgs/s${newImg}.svg`;

  current = newImg;
}, 3000);



let pageSize = 12;

const getProductsAPI = async (title, pageNum) => {
  const request = await fetch(
    host +
      "/product/search?title=" +
      title +
      "&page_num=" +
      pageNum +
      "&page_size=" +
      pageSize +
      "&token=" +
      token
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

  return responce;
};


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

async function displayProducts() {
  const holder = document.querySelector(".products-area");
  const responce = await getProductsAPI("", 1);
  const products = responce.products;
  holder.innerHTML = "";

  console.log(products);

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
    <span class="fav ${product.fav?"active":""}"><i class="fa-solid fa-heart"></i></span>

    <div class="product-body">
        <div class="desc">
            <h4 class="title">${product.title}</h4>
            <p class="info">${product.desc}</p>
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
}

displayProducts();