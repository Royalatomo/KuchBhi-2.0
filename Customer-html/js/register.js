import { host } from "./env.js";

const displayImg = document.querySelector(".display img");
let current = Math.floor(Math.random() * 3) + 1;
displayImg.src = `/resource/login/p${current}.svg`;
setInterval(() => {
  let newImg = Math.floor(Math.random() * 3) + 1;
  while (newImg === current) {
    newImg = Math.floor(Math.random() * 3) + 1;
  }
  displayImg.src = `/resource/login/p${newImg}.svg`;
  current = newImg;
}, 2000);

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

async function registerAPI(name, email, number, password) {
  const request = await fetch(host + "/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, number, password }),
  });

  if (!request.ok) {
    error.style.visibility = "visible";
    error.innerHTML = "missing fields";
    return;
  }
  const responce = await request.json();
  if (!responce.success) {
    error.style.visibility = "visible";
    error.innerHTML = responce.msg;
  }

  window.location.href = "/verify.html?email=" + email;
}

const register = document.querySelector("button.register");
register.addEventListener("click", () => {
  const fullName = document.querySelector("#name");
  const email = document.querySelector("#email");
  const number = document.querySelector("#mobile");
  const pass = document.querySelector("#pass");
  const conPass = document.querySelector("#cemail");

  if (!fullName.value) {
    error.style.visibility = "visible";
    error.innerHTML = "fill all the fields";
    fullName.focus();
    return;
  }

  if (!number.value) {
    error.style.visibility = "visible";
    error.innerHTML = "fill all the fields";
    number.focus();
    return;
  }

  if (!email.value) {
    error.style.visibility = "visible";
    error.innerHTML = "fill all the fields";
    email.focus();
    return;
  }

  if (!pass.value || pass.value.length < 6) {
    error.style.visibility = "visible";
    error.innerHTML = "password should be at least 6 characters";
    pass.focus();
    return;
  }

  if (pass.value !== conPass.value) {
    error.style.visibility = "visible";
    error.innerHTML = "Confirm password does not match";
    return;
  }

  error.style.visibility = "hidden";

  registerAPI(fullName.value, email.value, number.value, pass.value);
});
