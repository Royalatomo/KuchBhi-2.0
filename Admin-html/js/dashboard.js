import { host } from "./env.js";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login.html";
}

const getStatsAPI = async () => {
  const request = await fetch(host + "/admin/stats?token=" + token);

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

  return responce
};

const updateStatsVIEW = async () => {
  const responce = await getStatsAPI();

  document.querySelector(".text-info.customers h3").innerHTML = responce.data.numCustomer
  document.querySelector(".text-info.products h3").innerHTML = responce.data.numProducts
  document.querySelector(".text-info.orders h3").innerHTML = responce.data.numOrders
  document.querySelector(".text-info.revenue h3").innerHTML = numeral(responce.data.totalRev).format('0,0');
  document.querySelector(".text-info.pending h3").innerHTML = responce.data.pending
  document.querySelector(".text-info.processing h3").innerHTML = responce.data.processing
  document.querySelector(".text-info.completed h3").innerHTML = responce.data.completed
  document.querySelector(".text-info.rejected h3").innerHTML = responce.data.cancelled
}

updateStatsVIEW()