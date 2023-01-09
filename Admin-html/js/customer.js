import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

const customerContainer = document.querySelector(".customer-container");

const getCustomersAPI = async () => {
  const request = await fetch(host + "/admin/users?token=" + token);

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

const getCustomerByEmailAPI = async (email) => {
  const request = await fetch(host + "/user?token=" + token + "&email=" + email);

  if (!request.ok) {
    return;
  }

  const responce = await request.json();
  if (!responce.success) {
    alert(responce.msg);
    window.location.href = "/login.html";
    return;
  }

  return responce.user;
};

const terminateUserAPI = async (userEmail) => {
  const request = await fetch(host + "/admin/terminate-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({token, userEmail}),
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
};

const appendCustomersVIEW = async (email=false) => {
  let responce = []

  if (email){
    const user = (await getCustomerByEmailAPI(email))
    if (Object.keys(user).length <= 0) {
      customerContainer.innerHTML = "<h1 class='no-user'>No user found</h1>"
    }else {
      responce.push(user)
    }
  } else{
    responce = (await getCustomersAPI()).data;
    if (responce.length <= 0) {
      customerContainer.innerHTML = "<h1 class='no-user'>No user found</h1>"
    }
  }

  for(let customer of responce){
    const customerElm = document.createElement("div");
    customerElm.setAttribute("class", "customer");
    customerElm.innerHTML = `<img src="${customer.profile_url || "https://ik.imagekit.io/imdfhuoko/tr:h-250/user_scVChk2I5.jpg"}" alt="profile">
      <div class="customer-info">
          <div class="item">
              <p class="tag">Name:</p>
              <p class="value blue">${customer.name}</p>
          </div>
          <div class="item">
              <p class="tag">Email:</p>
              <p class="value green">${customer.email}</p>
          </div>
          <div class="item">
              <p class="tag">Phone:</p>
              <p class="value black">+91 <span>${customer.number}</span></p>
          </div>
          <div class="item">
              <p class="tag">Address:</p>
              <p class="value orange capital">${customer.location || "N/A"}</p>
          </div>
      </div>

      <div class="controlls">
          <button class="terminate">Terminate</button>
          <button class="orders">All Orders</button>
      </div>`

      customerElm.querySelector(".terminate").addEventListener("click", async () => {
        const conf = confirm("Are you sure you want to terminate this user?")
        if (!conf) return

        await terminateUserAPI(customer.email);
        customerElm.remove();
        alert("User terminated successfully");
      })
      
      customerElm.querySelector(".orders").addEventListener("click", async () => {
        window.location.href = "/orders.html?email=" + customer.email;
      })

      customerContainer.appendChild(customerElm);
    }
}

appendCustomersVIEW()

const searchBtn = document.querySelector(".search-box i");
searchBtn.addEventListener("click", async () => {
  const email = document.querySelector(".search-box input");
  if (!email.value) {
    customerContainer.innerHTML = ""
    appendCustomersVIEW();
    return;
  }

  customerContainer.innerHTML = ""
  appendCustomersVIEW(email.value);
})