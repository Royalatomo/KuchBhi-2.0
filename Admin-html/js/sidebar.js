import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

const sidebarStatus = localStorage.getItem('sidebar');

const leftSide = document.querySelector("main .left");
const header = document.querySelector("header");
const sidebarToogle = header.querySelector(".toggle-sidebar");

sidebarToogle.addEventListener("click", () => {
  leftSide.classList.toggle("hidden");
  header.classList.toggle("active");

  if (sidebarStatus === "hidden") {
    localStorage.setItem('sidebar', "visible");
    return;
  }

  localStorage.setItem('sidebar', "hidden");
});

if (sidebarStatus === "hidden") {
  leftSide.classList.add("hidden");
  header.classList.remove("active");
}

const updateAdminInfo = async () => {
  const name = localStorage.getItem('name');
  if (name) {
    document.querySelector(".info .name").innerHTML = name;
    return;
  }

  const request = await fetch(host + "/admin?token=" + token);

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
  localStorage.setItem('name', responce.data.name);
  document.querySelector(".info .name").innerHTML = responce.data.name;
};

const logoutAPI = async () => {
  const request = await fetch(host + "/admin/logout?token=" + token);

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

const logout = document.querySelector(".logout");
logout.addEventListener("click", async () => {
  const conf = confirm("Are you sure you want to logout?");
  if (!conf) {
    return;
  }
  await logoutAPI();
  localStorage.removeItem("token");
  localStorage.removeItem("name");
  window.location.href = "/login.html";
});

updateAdminInfo();