from fastapi import FastAPI, status
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import route_admin
import route_customers
import route_orders
import route_products

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------ Admins MODELS ------

# Creating New Admin Model
class CreateAdmin(BaseModel):
    name: str
    email: str
    password: str
    secret: str

# Login Admin Model
class AdminLogin(BaseModel):
    email: str
    password: str

# Logout Admin/Stats Model
# class Token(BaseModel):
#     token: str

# Terminating User account Model
class DeleteUser(BaseModel):
    token: str
    userEmail: str


# ------ Customers MODELS ------

# Getting user info Model
# class GetUserInfo(BaseModel):
#     session: str
#     full: Optional[bool] = False

# Creating user Model
class CreateUser(BaseModel):
    name: str
    email: str
    password: str
    number: str

# Updating user Model
class UpdateUser(BaseModel):
    name: Optional[str] = False
    number: Optional[str] = False
    location: Optional[str] = False
    profile_url: Optional[str] = False
    token: str

# Verifing account creating OTP Model
class VerifyOtp(BaseModel):
    email: str
    otp: str

# resend OTP Model
class ResendOtp(BaseModel):
    email: str

# Login user Model
class CustomerLogin(BaseModel):
    email: str
    password: str

# Logout user Model
# class CustomerLogout(BaseModel):
#     token: str

# Cart Model
class Cart(BaseModel):
    token: str
    product_id: str
    qty: int

# Favourite Model
class Favourite(BaseModel):
    token: str
    product_id: str


# --- Products MODELS ---

# Creating Product Model
class CreateProduct(BaseModel):
    title: str
    desc: str
    review_count: int
    stars: int
    price: int
    qty: int
    product_imgs: list
    token: str

# Updating Product Model
class UpdateProduct(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    review_count: Optional[int] = None
    stars: Optional[int] = None
    price: Optional[int] = None
    qty: Optional[int] = None
    product_imgs: Optional[list] = None
    token: str
    product_id: str

# Deleting Product Model
class DeleteProduct(BaseModel):
    token: str
    product_id: str

# Getting Product Model
# class GetProduct(BaseModel):
#     product_id: str

# Searching Product Model
# class SearchProduct(BaseModel):
#     title: str
#     review: str
#     price: str
#     page_size: Optional[int] = 8
#     page_num: Optional[int] = 0
#     token: Optional[str] = None


# --- Orders MODELS ---

# Creating order
class CreateOrder(BaseModel):
    product_id: str
    token: str
    discount_code: Optional[str] = None
    qty: int

class OrderStatus(BaseModel):
    status: str
    order_id: str
    token: str



## Admins Routes
@app.post("/admin")
def admin_register(body: CreateAdmin):
    try:
        return route_admin.createAdmin(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/admin")
def admin_register(token):
    try:
        return route_admin.getAdmin({"token": token})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.post("/admin/login")
def admin_login(body: AdminLogin):
    try:
        return route_admin.login_admin(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/admin/logout")
def admin_logout(token):
    try:
        return route_admin.logout_admin({"token": token})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.post("/admin/terminate-user")
def admin_terminate_user(body: DeleteUser):
    try:
        return route_admin.terminateUser(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/admin/users")
def admin_all_users(token):
    try:
        return route_customers.getAllUsers({"token": token})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/admin/stats")
def admin_all_users(token):
    try:
        return route_admin.getStatistics({"token": token})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}


## Customers Routes
@app.get("/user")
def user_info(token, email=False):
    try:
        return route_customers.getUser({"token": token, "email": email})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.post("/user")
def user_register(body: CreateUser):
    try:
        return route_customers.createUser(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.post("/user/verify")
def user_verify(body: VerifyOtp):
    try:
        return route_customers.verifyOtp(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.post("/user/resend-otp")
def user_resend_otp(body: ResendOtp):
    try:
        return route_customers.resendOtp(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.put("/user")
def user_update(body: UpdateUser):
    try:
        return route_customers.updateUser(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.post("/user/login")
def user_login(body: CustomerLogin):
    try:
        return route_customers.login(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/user/logout")
def user_logout(token):
    try:
        return route_customers.logout({"token": token})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}


@app.post("/user/favourite")
def user_fav_add(body: Favourite):
    try:
        return route_customers.addToFav(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.delete("/user/favourite")
def user_fav_del(body: Favourite):
    try:
        return route_customers.delToFav(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.post("/user/cart")
def user_cart(body: Cart):
    try:
        return route_customers.addToCart(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}



## Products Routes
@app.post("/product")
def product_create(body: CreateProduct):
    try:
        return route_products.addProduct(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.delete("/product")
def product_delete(body: DeleteProduct):
    try:
        return route_products.deleteProduct(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.put("/product")
def product_update(body: UpdateProduct):
    try:
        return route_products.updateProduct(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/product")
def product_info(product_id):
    try:
        return route_products.getProduct({"product_id": product_id})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/product/search")
def product_search(title, review = "", price = "", page_size = 8, page_num = 0, token = None, qty = ""):
    try:
        return route_products.searchingProduct({
            "title": title,
            "review": review or "",
            "price": price or "",
            "page_size": page_size or 8,
            "page_num": page_num or 0,
            "token": token or None,
            "qty": qty or ""
        })
    except Exception:
        return {"success": False, "msg": "Server error occurred"}



## Orders Routes
@app.post("/orders")
def orders_create(body: CreateOrder):
    try:
        return route_orders.createOrder(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.put("/orders")
def orders_status(body: OrderStatus):
    try:
        return route_orders.changeStatus(dict(body))
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/orders")
def orders_view(token, email = None, status = None):
    try:
        st = None
        if (status != None) and (status != ""):
            st = status

        return route_orders.getOrders({"token": token, "email": email or None, "status": st})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/orders/id")
def order_id(order_id):
    try:
        return route_orders.getOrderById({"order_id": order_id})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}

@app.get("/orders/get-info")
def order_id(token, discount_code=None):
    try:
        return route_orders.giveShippingDisc({"token": token, "discount_code": discount_code})
    except Exception:
        return {"success": False, "msg": "Server error occurred"}