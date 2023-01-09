import connection
from random import randrange
from hashlib import sha256
from route_admin import checkAdmin
import datetime as dt
from connection import returnDb

# Getting DB connection
mycon, myCursor = connection.getConnection()
myCursor.execute(f"USE {returnDb()}")


SHIPPING = {
    "mumbia": 200,
    "delhi": 50,
    "uttrakhand": 0,
    "punjab": 400,
    "usa": 3000,
    "russia": 5000,
    "other": 300
}

DISCOUNTS = {
    "flat20": 20,
    "flat30": 30,
    "flat40": 40
}
TAX_RATE = 18

def giveShippingDisc(body):
    try:
        myCursor.execute(f"SELECT email FROM sessions WHERE id = '{body['token']}'")
        customer_email = myCursor.fetchone()
        if not customer_email:
            return {"success": False, "msg": "authentication failed"}
        customer_email = customer_email[0]
        
        myCursor.execute(f"SELECT location FROM customers WHERE email = '{customer_email}'")
        location = myCursor.fetchone()
        if not location:
            location = "other"


        shipping = 0
        try:
            shipping = SHIPPING[location]
        except KeyError:
            shipping = SHIPPING["other"]
        
        discount = 0
        try:
            discount = DISCOUNTS[body['discount_code']]
        except KeyError:
            pass

        return {"success": True, "shipping": shipping, "discount": discount, "tax": TAX_RATE}
    except KeyError:
        return {"success": False, "msg": "missing fields"}


def createOrder(body):
    try:
        myCursor.execute(f"SELECT * FROM products WHERE id = '{body['product_id']}'")
        product = myCursor.fetchone()
        if not product:
            return {"success": False, "msg": "Product not found"}
        
        myCursor.execute(f"SELECT email FROM sessions WHERE id = '{body['token']}'")
        customer_email = myCursor.fetchone()
        if not customer_email:
            return {"success": False, "msg": "authentication failed"}

        if (body['qty'] > product[4]):
            return {"success": False, "msg": "Qty out of range"}

        myCursor.execute(f"UPDATE products SET qty = qty - {body['qty']} WHERE id = '{body['product_id']}'")
        customer_email = customer_email[0]
        date = dt.datetime.now().date()
        randomString = f"{randrange(0, 100)} {body['product_id']} {randrange(0, 100)} {body['token']}"
        order_id = sha256(randomString.encode()).hexdigest()[0:10]
        status = 0 # 0 - Pending
        discount = 0

        myCursor.execute(f"SELECT location FROM customers WHERE email = '{customer_email}'")
        address = myCursor.fetchone()

        try:
            if body['discount_code'] in DISCOUNTS.keys():
                discount = DISCOUNTS[body['discount_code']]
        except KeyError:
            pass
        
        shipping = SHIPPING['other']
        if address in SHIPPING.keys():
            shipping = SHIPPING[address]
        myCursor.execute(f"INSERT INTO orders VALUES('{order_id}', '{body['product_id']}', '{customer_email}', {status}, {body['qty']}, {shipping}, {discount}, {TAX_RATE}, '{date}')")
        mycon.commit()
        return {"success": True, "msg": "Order created successfully"}

    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(createOrder({
#     "product_id": 'efe9752e51',
#     "token": "7da43360d73ad3f1ad8de5f1ddc1be956466b5c78bf1f258946c2bb169ada11f",
#     "discount_code": "flat40",
#     "address": "russia",
#     "qty": 200
# }))


def changeStatus(body):
    try:
        # Checking if token have admin authorization
        check = checkAdmin(body['token']) 
        if not check['success']:
            return check

        myCursor.execute(f"SELECT * FROM orders WHERE id = '{body['order_id']}'")
        order = myCursor.fetchone()
        if not order:
            return {"success": False, "msg": "Order not found"}
        
        if int(body['status']) < 0 or int(body['status']) > 3:
            return {"success": False, "msg": "Unkown status code"}

        myCursor.execute(f"UPDATE orders SET status = {body['status']} WHERE id = '{body['order_id']}'")
        mycon.commit()
        return {"success": True, "msg": "Order successfully updated"}
    except KeyError:
        return {"success": False, "msg": "missing fields"}

def getOrders(body):
    try:
        # Checking if token have admin authorization
        check = (checkAdmin(body['token']))['success']

        if check:
            if body['email'] and body['status']:
                myCursor.execute(f"SELECT * FROM orders WHERE email = '{body['email']}' AND status = '{body['status']}'")
            elif body['status']:
                myCursor.execute(f"SELECT * FROM orders WHERE status = '{body['status']}'")
            elif body['email']:
                myCursor.execute(f"SELECT * FROM orders WHERE email = '{body['email']}'")
            else:
                myCursor.execute(f"SELECT * FROM orders")
        else:
            myCursor.execute(f"SELECT email FROM sessions where id = '{body['token']}'")
            email = myCursor.fetchone() or ""
            myCursor.reset()
            email =  email[0] if email else False

            if body['status']:
                myCursor.execute(f"SELECT * FROM orders WHERE status = '{body['status']}' AND email = '{email}'")
            else:
                myCursor.execute(f"SELECT * FROM orders WHERE email = '{email}'")

        allOrders = myCursor.fetchall()
        if not allOrders:
            return {"success": True, "data": []}

        formatedOrders = []
        for order in allOrders:
            # total revenue
            myCursor.execute(f"SELECT price*orders.qty FROM products,orders WHERE products.id = orders.product_id AND orders.id = '{order[0]}'")
            revenue = myCursor.fetchone() or 0
            if revenue:
                revenue = round(revenue[0])
            
            myCursor.execute(f"SELECT (price*orders.qty/100)*orders.discount FROM products,orders WHERE products.id = orders.product_id AND orders.id = '{order[0]}'")
            discount = myCursor.fetchone() or 0
            if discount:
                discount = round(discount[0])
            
            result = {
                "id": order[0],
                "product_id": order[1],
                "customer_email": order[2],
                "status": order[3],
                "qty": order[4]
            }

            if check:
                result['total_amount'] = revenue-discount
            else:
                amt_disc = (revenue/100)*order[6]
                amt_tax = (revenue/100)*order[7]
                result['total_amount'] = revenue - amt_disc + amt_tax + order[5]

            formatedOrders.append(result)
        
        return {"success": True, "data": formatedOrders}
    except KeyError:
        return {"success": False, "msg": "missing fields"}


def getOrderById(body):
    try:
        myCursor.execute(f"SELECT * FROM orders WHERE id = '{body['order_id']}'")
        order = myCursor.fetchone()
        if not order:
            return {"success": True, "data": {}}
        
        myCursor.execute(f"SELECT price FROM products WHERE id = '{order[1]}'")
        price = myCursor.fetchone() or 0
        if price:
            price = price[0]

        formatedOrder = {
            "id": order[0],
            "product_id": order[1],
            "customer_email": order[2],
            "status": order[3],
            "qty": order[4],
            "shipping": order[5],
            "discount": order[6],
            "tax": order[7],
            "date": order[8],
            "product_price": price
        }
        
        return {"success": True, "data": formatedOrder}
    except KeyError:
        return {"success": False, "msg": "missing fields"}


# print(changeStatus({"token": "fc3cb7c3a6ff1f9bab3e2763294e57819054b2c29b327504c1fd5639a4734c97", "status": 2, "order_id": '579b4bd327'}))