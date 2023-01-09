import { searchQuery } from "./cfunc.js";
import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

const getProductsAPI = async (title) => {
  const request = await fetch(host + "/product/search?title=" + title);

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

const searchbox = document.querySelector("header .search-box");
const searchResult = document.querySelector("header .search-results");

searchbox.addEventListener("click", () => {
  searchbox.classList.add("active");
});

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

searchbox.addEventListener("input", async () => {
  const inputVal = searchbox.querySelector("input").value;
  if (inputVal) {
    searchResult.innerHTML = "";
    const products = (await getProductsAPI(inputVal)).products;

    for (let product of products) {
      const searchItem = document.createElement("a");
      searchItem.setAttribute("class", "result");
      searchItem.setAttribute("href", "/product.html?id=" + product.id);

      let firstImg = "";
      for (let img of product.product_imgs) {
        if (img !== "") {
          firstImg = img;
          break;
        }
      }

      searchItem.innerHTML = `<div class="container">
        <span class="result-img">
            <img src="${firstImg}" alt="laptop">
        </span>
    
        <p class="result-title">${product.title}</p>
      </div>
    
      <div class="reviews">
          <div class="stars">${returnStars(product.stars)}</div>
          <span>(${product.review_count})</span>
      </div>
    
      <p class="price"><sup>₹</sup>${numeral(product.price).format("0,0")}</p>`;

      searchResult.appendChild(searchItem);
    }
    searchResult.classList.add("active");
  }
});

document.body.addEventListener("click", (e) => {
  const target = e.target;
  const parent = target.parentElement;
  const isSearhBoxClicked =
    target.classList.contains("search-box") ||
    parent.classList.contains("search-box");

  if (!isSearhBoxClicked) {
    searchbox.classList.remove("active");
    searchResult.classList.remove("active");
  }
});

const hamburger = document.querySelector("header .menu-btn");
const navigation = document.querySelector("header .navigations");
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navigation.classList.toggle("active");
});

const searchButton = document.querySelector(".search-box i");
const input = document.querySelector(".search-box input");

searchButton.addEventListener("click", () => {
  searchQuery(input.value);
});

input.addEventListener("keypress", (event) => {
  if (event.keyCode === 13) {
    searchQuery(input.value);
  }
});

//
const category = document.querySelector("header .categories");
category.addEventListener("click", () => {
  category.classList.toggle("active");
});

const options = category.querySelectorAll(".option");
options.forEach((option) => {
  option.addEventListener("mouseenter", () => {
    option.querySelector(".sub-menu").classList.add("active");
  });

  option.addEventListener("mouseleave", () => {
    option.querySelector(".sub-menu").classList.remove("active");
  });

  option.addEventListener("click", (e) => {
    const dataSet =
      e.target.dataset.value || e.target.parentElement.dataset.value;
    if (dataSet) {
      searchQuery(dataSet);
    }
  });
});
