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

async function loginAPI(email, password) {
  const request = await fetch(host + "/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
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
    return;
  }

  localStorage.setItem("token", responce.token);
  window.location.href = "/";
}


const loginBtn = document.querySelector(".login");
loginBtn.addEventListener("click", () => {
  const email = document.querySelector("#email");
  const pass = document.querySelector("#pass");

  if (!email.value) {
    error.style.visibility = "visible";
    error.innerHTML = "fill all the fields";
    email.focus();
    return;
  }

  if (!pass.value) {
    error.style.visibility = "visible";
    error.innerHTML = "fill all the fields";
    pass.focus();
    return;
  }

  error.style.visibility = "hidden";
  loginAPI(email.value, pass.value);

});
