import { host } from "./env.js";

const eyeIcon = document.querySelector(".password .eye");
eyeIcon.addEventListener("click", () => {
  const type = document.querySelector(".password input");
  if (type.getAttribute("type") === "text") {
    type.setAttribute("type", "password");
    eyeIcon.classList.remove("fa-eye-slash");
    eyeIcon.classList.add("fa-eye");
  } else {
    type.setAttribute("type", "text");
    eyeIcon.classList.remove("fa-eye");
    eyeIcon.classList.add("fa-eye-slash");
  }
});

const error = document.querySelector(".err-msg");


async function registerAPI(name, email, password, secret) {
  const request = await fetch(host + "/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, secret }),
  });

  console.log(request);

  if (!request.ok) {
    error.style.visibility = "visible";
    error.innerHTML = "missing fields";
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

const loginBtn = document.querySelector(".login");
loginBtn.addEventListener("click", () => {
  const name = document.querySelector("#name");
  const secret = document.querySelector("#secret");
  const email = document.querySelector("#email");
  const pass = document.querySelector("#pass");

  if (!name.value) {
    error.style.visibility = "visible";
    error.innerHTML = "Name is required";
    name.focus();
    return;
  }

  if (!email.value) {
    error.style.visibility = "visible";
    error.innerHTML = "Email is required";
    email.focus();
    return;
  }

  if (!pass.value) {
    error.style.visibility = "visible";
    error.innerHTML = "Password can't be blank";
    pass.focus();
    return;
  }

  if (!secret.value) {
    error.style.visibility = "visible";
    error.innerHTML = "Secret code is required";
    secret.focus();
    return;
  }

  error.style.visibility = "hidden";
  registerAPI(name.value, email.value, pass.value, secret.value);
});
