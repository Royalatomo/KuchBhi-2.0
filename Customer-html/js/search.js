import { saveToFav, changePage, saveToCart } from "./cfunc.js";
import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

const PAGE_SIZE = 6;
let PAGE_NUM = 1;
let REVIEW = "hl";
let PRICE = "";

const getProductsAPI = async (title) => {
  const request = await fetch(
    host + "/product/search?title=" +
    title + "&page_size=" +
    PAGE_SIZE + "&page_num=" +
    PAGE_NUM + "&token=" +
    token + "&review=" + REVIEW + "&price=" + PRICE
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

const query = location.href.split("?q=")[1];

document.querySelector(".search-box input").value = query;

const sortBtn = document.querySelector(".meta-info .sort");
const dropMenu = sortBtn.querySelector(".drop-menu");
const title = document.querySelector(".meta-info .title span");

title.innerText = query.split("+").join(" ");

sortBtn.addEventListener("click", (e) => {
  if (
    !e.target.classList.contains("drop-menu") &&
    !e.target.classList.contains("item")
  ) {
    dropMenu.classList.toggle("active");
  }
});

dropMenu.querySelectorAll(".item").forEach((item) => {
  item.addEventListener("click", () => {
    // const value = item.dataset.value; --- value
    sortBtn.querySelector(".selected").innerText = item.innerText;
    const valSplit = item.dataset.value.split("-");

    if (valSplit[0] === 'r') {
      PRICE = "";
      REVIEW = valSplit[1];
    }else {
      REVIEW = "";
      PRICE = valSplit[1];
    }

    appendResultVIEW();
    dropMenu.classList.remove("active");
  });
});

const resultContainer = document.querySelector(".product-container");

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
const pageChanger = document.querySelector(".page-changer");

function initiatePageChange(num) {
  pageChanger.innerHTML = "";

  for (let i = 1; i <= num; i++) {
    const item = document.createElement("span");
    item.classList.add("item");
    item.innerHTML = i;

    if (i === PAGE_NUM) {
      item.classList.add("active");
    }

    pageChanger.appendChild(item);
  }
}

const appendResultVIEW = async () => {
  window.scrollTo(0, 0)
  const responce = await getProductsAPI(query);
  const products = responce.products;
  const totalPages = responce.total_pages;
  resultContainer.innerHTML = "";

  if (products.length === 0) {
    resultContainer.innerHTML = "<h1>No Products Found</h1>";
    return;
  }

  for (let product of products) {
    const productElm = document.createElement("div");
    productElm.classList.add("product");
    let firstImg = "";
    for (let img of product.product_imgs) {
      if (img !== "") {
        firstImg = img;
        break;
      }
    }

    productElm.innerHTML = `
      <a href="/product.html?id=${product.id}" class="product-head">
          <img src="${firstImg}" alt="laptop">
      </a>
      <span class="fav ${product.fav?"active": ""}">
          <i class="fa-solid fa-heart"></i>
      </span>

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
          <p class="price"><sup>₹</sup>${numeral(product.price).format(
            "0,0"
          )}</p>
      </div>`;

    const productFav = productElm.querySelector(".fav");
    productFav.addEventListener("click", () => {
      saveToFav(productFav, product.id);
    });

    const productCart = productElm.querySelector(".cart");
    productCart.addEventListener("click", () => {
      saveToCart(product.id);
    });

    resultContainer.appendChild(productElm);
  }

  initiatePageChange(totalPages);
};

pageChanger.addEventListener("click", (e) => {
  const target = e.target;
  const classList = target.classList;

  if (classList.contains("page-changer")) {
    return;
  }

  if (classList.contains("item")) {
    PAGE_NUM = parseInt(target.innerHTML);
    changePage(target);
    appendResultVIEW();
  }
});

appendResultVIEW();