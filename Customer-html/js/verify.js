import { host } from "./env.js";

const email = location.href.split("?email=")[1];
const error = document.querySelector("#error");

async function verifyAPI(otp) {
  const request = await fetch(host + "/user/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  if (!request.ok) {
    error.style.visibility = "visible";
    error.innerHTML = "otp is empty";
    return;
  }

  const responce = await request.json();
  if (!responce.success) {
    error.style.visibility = "visible";
    error.innerHTML = responce.msg;
    return;
  }

  localStorage.setItem("token", responce.token);
  window.location.href = "/";
}

async function resendAPI() {
  const request = await fetch(host + "/user/resend-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!request.ok) {
    error.style.visibility = "visible";
    error.innerHTML = "something went wrong";
    return;
  }

  const responce = await request.json();
  error.style.visibility = "visible";
  error.innerHTML = responce.msg;
}

const button = document.querySelector(".submit");
button.addEventListener("click", () => {
  const otp = document.querySelector("#otp");
  if(!otp.value) {
    error.style.visibility = "visible";
    error.innerHTML = "otp is empty";
  }
  verifyAPI(otp.value);
})

const resend = document.querySelector(".resend");
resend.addEventListener("click", () => {
  if (resend.classList.contains("disable")) {
    error.style.visibility = "visible";
    error.innerHTML = "Wait 5s before resending";
    return;
  }

  resend.classList.add("disable");

  resendAPI();

  setTimeout(() => {
    resend.classList.remove("disable");
  }, 5000)
})