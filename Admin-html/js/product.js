import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

const productsContainer = document.querySelector(".products-container");
const productPopup = document.querySelector(".product-popup");

productPopup.querySelector(".popup-back").addEventListener("click", () => {
  productPopup.classList.remove("active");
});

const pageSize = 8;
let pageNum = 1;
let qty = "";

const getProductsAPI = async () => {
  const request = await fetch(
    host +
      "/product/search?title=&page_num=" +
      pageNum +
      "&page_size=" +
      pageSize +
      "&qty=" +
      qty
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

const updateProductAPI = async (title,stars,review_count,qty,price,description,product_imgs,product_id) => {
  const request = await fetch(host + "/product", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({title, stars, review_count, qty, price, product_imgs, description, product_id,token}),
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
};

const updateProduct = async (id) => {
  const responce = await getProductByIdAPI(id);
  document.querySelector(".product-popup").dataset.id = id;
  document.querySelector(".product-popup #name").value = responce.data.title;
  document.querySelector(".product-popup #reviews").value =
    responce.data.review_count;
  document.querySelector(".product-popup #qty").value = responce.data.qty;
  document.querySelector(".product-popup #price").value = responce.data.price;
  document.querySelector(".product-popup #desc").value =
    responce.data.description;
  const responceImgs = responce.data.product_imgs;
  const stars = parseInt(responce.data.stars) - 1;

  const imageBoxes = document.querySelectorAll(".popup-image input");
  for (let i = 0; i < responceImgs.length; i++) {
    imageBoxes[i].value = responceImgs[i];
  }

  document.querySelector("select#stars").querySelectorAll("option")[
    stars
  ].selected = "selected";
  productPopup.classList.add("active");
};

function productStars(num) {
  let retHtml = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= parseInt(num)) {
      retHtml += '<i class="fa-solid fa-star"></i>';
    } else {
      retHtml += '<i class="fa-regular fa-star"></i>';
    }
  }

  return retHtml;
}

const appendProducts = async () => {
  const responce = await getProductsAPI();

  for (let product of responce.products) {
    const productElm = document.createElement("div");
    productElm.setAttribute("class", "product");
    productElm.setAttribute("id", "pi-" + product.id);
    let firstImg = product.product_imgs;

    for (let img of firstImg) {
      if(img){
        firstImg = img;
        break;
      }
    }

    productElm.innerHTML = `<div class="box">
      <div class="image">
          <img src="${firstImg}" alt="product">
          <p class="qty">Qty: <span>${product.qty}</span></p>
      </div>

      <div class="info">
          <h1 class="name">${product.title}</h1>
          <p class="desc">${product.desc}</p>

          <div class="review">${productStars(
            product.stars
          )}<p class="review-count">(${product.review_count})</p></div>
      </div>
    </div>
    <p class="price">₹ <span>${numeral(product.price).format(
      "0,0"
    )}</span></p>`;

    productElm.addEventListener("click", () => {
      document.querySelector(".popup-delete").classList.remove("hidden");
      document.querySelector(".popup-save").innerHTML = "Save";
      updateProduct(product.id)
    });

    productsContainer.appendChild(productElm);
  }

  const prvBtn = document.getElementById("show-more");
  if (prvBtn) {
    prvBtn.remove();
  }

  console.log(responce);

  if (responce.total_pages && responce.total_pages !== responce.current_page) {
    const btn = document.createElement("button");
    btn.setAttribute("id", "show-more");
    btn.innerText = "Show more";
    productsContainer.appendChild(btn);
    pageNum = parseInt(responce.current_page) + 1;
    btn.addEventListener("click", () => appendProducts());
  }
};

appendProducts();

const sorting = document.querySelector(".sorting");
sorting.addEventListener("change", () => {
  productsContainer.innerHTML = "";
  qty = sorting.value;
  appendProducts();
});


const createProductAPI = async (title,stars,review_count,qty,price,desc,product_imgs,product_id) => {
  const request = await fetch(host + "/product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({title,stars,review_count,qty,price,desc,product_imgs,product_id,token}),
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


function checkEmpty() {
  const popup = document.querySelector(".product-popup");
  const title = popup.querySelector("#name");
  const review = popup.querySelector("#reviews");
  const qty = popup.querySelector("#qty");
  const price = popup.querySelector("#price");
  const desc = popup.querySelector("#desc");
  const stars = popup.querySelector("select");
  const img = popup.querySelectorAll(".popup-image input");
  let filledImg = false

  for (let i of img){
    if (i.value !== "") {
      filledImg = true;
      break;
    }
  }

  if (!title.value) {
    alert("Title is required");
    title.focus();
  }
  else if (!review.value) {
    alert("Review is required");
    review.focus()
  }
  else if (!qty.value) {
    alert("Qty is required");
    qty.focus();
  }
  else if (!price.value){
    alert("Price is required");
    price.focus();
  }
  else if (!desc.value){
    alert("Description is required");
    desc.focus()
  }
  else if (!stars.value) {
    alert("Stars are required");
    stars.focus();
  }
  else if (!filledImg){
    alert("At least one image is required");
    img[0].focus();
  }
  else return true;

}

const popupSave = document.querySelector(".popup-save");

popupSave.addEventListener("click", async () => {
  const fieldsAreFilled = checkEmpty()
  if(!fieldsAreFilled) return;

  const popup = document.querySelector(".product-popup");
  const pid = popup.dataset.id;
  const title = popup.querySelector("#name").value;
  const review = popup.querySelector("#reviews").value;
  const qty = popup.querySelector("#qty").value;
  const price = popup.querySelector("#price").value;
  const desc = popup.querySelector("#desc").value;
  const stars = popup.querySelector("select").value;
  const imgs = [];
  
  popup.querySelectorAll(".popup-image input").forEach((img) => imgs.push(img.value));
  let firstImg = imgs;

  for (let img of firstImg) {
    if(img){
      firstImg = img;
      break;
    }
  }

  if (pid == "pi-new"){
    await createProductAPI(title, stars, review, qty, price, desc, imgs, pid);
    productsContainer.innerHTML = "";
    await appendProducts();
    popup.classList.remove("active");
    return;
  }

  await updateProductAPI(title, stars, review, qty, price, desc, imgs, pid);

  const pElem = document.getElementById("pi-" + pid);
  pElem.innerHTML = `<div class="box">
    <div class="image">
        <img src="${firstImg}" alt="product">
        <p class="qty">Qty: <span>${qty}</span></p>
    </div>

    <div class="info">
        <h1 class="name">${title}</h1>
        <p class="desc">${desc}</p>

        <div class="review">${productStars(
          stars
        )}<p class="review-count">(${review})</p></div>
    </div>
  </div>
  <p class="price">₹ <span>${numeral(price).format("0,0")}</span></p>`;

  popup.classList.remove("active");
});

const deleteProductAPI = async (product_id) => {
  const request = await fetch(host + "/product", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({product_id,token}),
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
};

const popupDelete = document.querySelector(".popup-delete");
popupDelete.addEventListener("click", async () => {
  const conf = confirm("Are you sure you want to delete this product?");
  if(!conf) return;
  const popup = document.querySelector(".product-popup");
  const pid = popup.dataset.id;
  await deleteProductAPI(pid);

  document.getElementById("pi-" + pid).remove();
  popup.classList.remove("active");
})


const createProductBtn = document.querySelector("#create-product");
createProductBtn.addEventListener("click", () => {
  const popup = document.querySelector(".product-popup");
  popup.dataset.id = "pi-new";
  popup.querySelector("#name").value = "";
  popup.querySelector("#reviews").value = 0;
  popup.querySelector("#qty").value = 1;
  popup.querySelector("#price").value = "";
  popup.querySelector("#desc").value = "";
  popup.querySelector("select option").selected = "selected";
  popup.querySelector(".popup-delete").classList.add("hidden");
  popup.querySelector(".popup-save").innerHTML = "Create";

  popup.querySelectorAll(".popup-image input").forEach((img) => img.value = "");
  popup.classList.add("active");
});