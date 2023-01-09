import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

async function productFavAPI(product_id) {
  const request = await fetch(host + "/user/favourite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, product_id }),
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
}

async function rmProductFavAPI(product_id) {
  const request = await fetch(host + "/user/favourite", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, product_id }),
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
}

async function productCartAPI(product_id, qty) {
  const request = await fetch(host + "/user/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, product_id, qty }),
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
}

export const saveToFav = (e, id) => {
  if (e.classList.contains("active")) {
    rmProductFavAPI(id)
  }else {
    productFavAPI(id)
  }
  e.classList.toggle("active");
};

export const saveToCart = (id, qty=1) => {
  productCartAPI(id, qty);
};

export const changePage = (e) => {
  const pageChanger = document.querySelector(".page-changer");
  const activePage = pageChanger.querySelector(".item.active");
  activePage.classList.remove("active");

  if (e?.classList) {
    e.classList.add("active");
    return;
  }

  const allItems = pageChanger.querySelectorAll(".item");
  for (let i = 0; i < allItems.length; i++) {
    if (i == e) {
      allItems[i].classList.add("active");
    }
  }

  
};

export const searchQuery = (q) => {
  const userTyped = q.trim().split(" ") || [];
  let query = "";

  for (let i = 0; i < userTyped.length; i++) {
    const word = userTyped[i];

    if (word == "") {
      continue;
    } else {
      query += word;
      if (i !== userTyped.length - 1) {
        query += "+";
      }
    }
  }

  const mainLink = location.origin;
  location.href = mainLink + `/search.html?q=${query}`;
};
