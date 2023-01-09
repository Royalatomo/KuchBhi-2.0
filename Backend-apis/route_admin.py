
from random import randrange
from hashlib import sha256
import connection

# Getting DB connection
mycon, myCursor = connection.getConnection()
myCursor.execute("USE kuchbhi")

# Code used for adding new admin
SECRET_CODE = "kuchbhiadmin"


# Login Admin account
def login_admin(body):
    try:
        # Checking if email and password matching
        if not body['email']:
            raise Exception
        email = body['email']
        password = sha256(body['password'].encode()).hexdigest()
        myCursor.execute(f"SELECT * FROM admins WHERE email = '{email}' AND password = '{password}'")
        admin = myCursor.fetchone()
        myCursor.reset()

        if admin:
            # if matched create session
            myCursor.execute(f"DELETE FROM sessions_admin WHERE email = '{email}'")
            token = sha256(f"{randrange(0, 100)}{body['password']}{randrange(0, 100)}".encode()).hexdigest()
            myCursor.execute(f"INSERT INTO sessions_admin (id, email) VALUES ('{token}', '{email}')")
            mycon.commit()
            return {"success": True, "token": token}
        return {"success": False, "msg": "Email or password do not match"}
    except  KeyError:
        return {"success": False, "msg": "missing fields"}

# print(login_admin({"email": "rahul@mail.com", "password": "12345"}))


# Creating New Admin
def createAdmin(body):
    try:
        if not body['secret'] == SECRET_CODE:
            return {"success": False, "msg": "wrong code"}

        # Checking if email already exists
        myCursor.execute(f"SELECT name FROM admins where email = '{body['email']}'")
        if (myCursor.fetchone()):
            return {"success": False, "msg": "email already exists"}

        # Hashing password
        password = sha256(body['password'].encode()).hexdigest()

        # Creating Admin
        myCursor.execute(f"INSERT INTO admins VALUES('{body['name']}', '{body['email']}', '{password}')")
        mycon.commit()
        return login_admin({"email": body['email'], "password": body['password']})
    except KeyError:
        return {"success": False, "msg": "missing fields"}


# print(createAdmin({"name": "Rahul S Rawat", "email": "rahul@mail.com", "password": "12345", "secret": "kuchbhiadmin"}))


# Login Admin account
def logout_admin(body):
    try:
        token = body['token']
        myCursor.execute(f"DELETE FROM sessions_admin WHERE id = '{token}'")
        mycon.commit()
        return {"success": True, "msg": "admin account logged out"}
    except KeyError:
        return {"success": False, "msg": "missing field"}

# print(logout_admin({"token": '1924b791fbd2bba5c852446fdf9de26ae45a135451b1c5052fbcf8bc0917c09e'}))

# Login Admin account
def getAdmin(body):
    try:
        token = body['token']
        myCursor.execute(f"SELECT email from sessions_admin WHERE id = '{token}'")
        email = myCursor.fetchone()[0]

        
        myCursor.execute(f"SELECT name, email from admins WHERE email = '{email}'")
        data = myCursor.fetchone()
        return {"success": True, "data": {"name": data[0], "email": data[1]}}
    except KeyError:
        return {"success": False, "msg": "missing field"}
    except TypeError:
        return {"success": False, "msg": "invalid token"}


# Check if token has admin authorization
def checkAdmin(token):
    try:
        if token == '':
            raise Exception
        myCursor.execute(f"SELECT email FROM sessions_admin WHERE id = '{token}'")
        record = myCursor.fetchone()
        myCursor.reset()
        if record:
            return {"success": True, "msg": "have admin authorization"}
        return {"success": False, "msg": "no admin authorization"}
    except KeyError:
        return {"success": False, "msg": "missing field"}

# print(checkAdmin({"token": '7a879f011c8e15287d471166687bd96a1b68fd67c9afaf86564f5832335a3669'}))


# Terminate User account
def terminateUser(body):
    try:
        # Checking if token have admin authorization
        check = checkAdmin(body['token']) 
        if not check['success']:
            return check

        myCursor.execute(f"DELETE FROM sessions WHERE email = '{body['userEmail']}'")
        myCursor.execute(f"DELETE FROM customers WHERE email = '{body['userEmail']}'")
        mycon.commit()
        return {"success": True, "msg": "user deleted successfully"}
    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(terminateUser({"token": '51d8e1ea294e5dd8d738996622429db57384fa3d66d39d1b88ff05f332ec2514', "email": 'bingo@mail.com'}))


# Get Statistics
def getStatistics(body):
    try:
        # Checking if token have admin authorization
        check = checkAdmin(body['token']) 
        if not check['success']:
            return check

        # number of customers
        myCursor.execute(f"SELECT COUNT(*) FROM customers")
        numCustomer = myCursor.fetchone() or 0
        if numCustomer:
            numCustomer = numCustomer[0]
        
        # number of products
        myCursor.execute(f"SELECT COUNT(*) FROM products")
        numProducts = myCursor.fetchone() or 0
        if numProducts:
            numProducts = numProducts[0]
        
        # number of orders
        myCursor.execute(f"SELECT COUNT(*) FROM orders")
        numOrders = myCursor.fetchone() or 0
        if numOrders:
            numOrders = numOrders[0]

        # total revenue
        myCursor.execute(f"SELECT SUM(price*orders.qty) FROM products,orders WHERE products.id = orders.product_id")
        totalSale = myCursor.fetchall()[0][0] or 0
        if totalSale:
            totalSale = round(totalSale)
        
        myCursor.execute(f"SELECT SUM((price*orders.qty/100)*orders.discount) FROM products,orders WHERE products.id = orders.product_id")
        totalDiscount = myCursor.fetchall()[0][0] or 0
        if totalDiscount:
            totalDiscount = round(totalDiscount)

        totalRev = totalSale - totalDiscount


        # pending orders
        myCursor.execute(f"SELECT COUNT(*) FROM orders WHERE status = 0")
        pending = myCursor.fetchone()
        if pending:
            pending = pending[0]

        # processing orders
        myCursor.execute(f"SELECT COUNT(*) FROM orders WHERE status = 1")
        processing = myCursor.fetchone()
        if processing:
            processing = processing[0]

        # completed orders
        myCursor.execute(f"SELECT COUNT(*) FROM orders WHERE status = 2")
        completed = myCursor.fetchone()
        if completed:
            completed = completed[0]

        # cancelled orders
        myCursor.execute(f"SELECT COUNT(*) FROM orders WHERE status = 3")
        cancelled = myCursor.fetchone()
        if cancelled:
            cancelled = cancelled[0]

        return {"success": True, "data": {
            "numCustomer": numCustomer,
            "numOrders": numOrders,
            "numProducts": numProducts,
            "pending": pending,
            "processing": processing,
            "completed": completed,
            "cancelled": cancelled,
            "totalRev": totalRev
        }}

    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(getStatistics({"token": "fc3cb7c3a6ff1f9bab3e2763294e57819054b2c29b327504c1fd5639a4734c97"}))