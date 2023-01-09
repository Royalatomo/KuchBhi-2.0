import connection
from random import randrange
from hashlib import sha256
import json
from route_admin import checkAdmin

# Getting DB connection
mycon, myCursor = connection.getConnection()
myCursor.execute("USE kuchbhi")

# Getting email from session token
def tokenToMail(sid):
    myCursor.execute(f"SELECT email FROM sessions where id = '{sid}'")
    email = myCursor.fetchone() or ""
    myCursor.reset()
    return email[0] if email else False


# Getting all users
def getAllUsers(body):
    try:
        # Checking if token have admin authorization
        check = checkAdmin(body['token']) 
        if not check['success']:
            return check

        myCursor.execute("SELECT name, number, email, location, profile_url FROM customers")
        users = myCursor.fetchall()
        formatedUsers = []
        
        for user in users:
            formatedUsers.append({
                "name": user[0],
                "number": user[1],
                "email": user[2],
                "location": user[3],
                "profile_url": user[4]
            })

        return {"success": True, "data": formatedUsers}
    except KeyError:
        return {"success": False, "msg": "missing fields"}

# Getting user info
def getUser(body):
    try:
        # Checking if token have admin authorization
        check = checkAdmin(body['token'])['success']
        print(check)

        if check:
            myCursor.execute(f"SELECT name, number, email, location, profile_url FROM customers where email = '{body['email']}'")
            info = myCursor.fetchone() or ""
            if not info:
                return {"success": True, "user": {}}
            return {"success": True, "user": {"name": info[0], "number": info[1], "email": info[2], "location": info[3], "profile_url": info[4]}}

        # Checking if token is valid
        email = tokenToMail(body["token"])
        if not email:
            return {"success": False, "msg": "Invalid session token"}
        

        # Getting user info from email
        myCursor.execute(f"SELECT name, number, email, location, profile_url, fav, cart FROM customers where email = '{email}'")
        info = myCursor.fetchone() or ""
        myCursor.reset()
        if not info:
            return {"success": True, "user": {}}
        return {"success": True, "user": {"name": info[0], "number": info[1], "email": info[2], "location": info[3], "profile_url": info[4], "fav": json.loads(info[5] or "[]"), "cart": json.loads(info[6] or "[]")}}
    except KeyError:
        return {"success": False, "msg": "missing field"}

# print(getUser({"session": "7da43360d73ad3f1ad8de5f1ddc1be956466b5c78bf1f258946c2bb169ada11f", "full": True}))


# Creating new user
def createUser(body):
    try:
        # Checking if email already exists
        myCursor.execute(f"SELECT name FROM customers where email = '{body['email']}'")
        if (myCursor.fetchone()):
            return {"success": False, "msg": "email already exists"}

        # Creating OTP for verification
        otp = ""
        for i in range(6):
            otp += str(randrange(0, 10))

        # Hashing password
        password = sha256(body['password'].encode()).hexdigest()

        # Checking if OTP send to same email previosuly
        myCursor.execute(f"DELETE FROM verify WHERE email = '{body['email']}'")

        # Creating OTP for verification
        myCursor.execute(f"INSERT INTO verify(name, number, email, password, otp) VALUES('{body['name']}', '{body['number']}', '{body['email']}', '{password}', '{otp}')")
        mycon.commit()
        return {"success": True, "msg": "otp send for verification", "otp": otp}

    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(createUser({"name": "peso pati", "email": "bingo@mail.com", "password": "123", "number": "9865854965"}))


# Login user account
def login(body, passhash=False):
    try:
        # Checking if email and password are correct
        email = body['email']
        password = body['password']
        if not passhash:
            password = sha256(body['password'].encode()).hexdigest()
        myCursor.execute(f"SELECT * FROM customers WHERE email = '{email}' AND password = '{password}'")
        customer = myCursor.fetchone()
        myCursor.reset()

        # If user found with same credentials
        if customer:
            # expiring previous session if any
            myCursor.execute(f"DELETE FROM sessions WHERE email = '{email}'")
            # creating new session
            token = sha256(f"{randrange(0, 100)}{body['password']}{randrange(0, 100)}".encode()).hexdigest()
            myCursor.execute(f"INSERT INTO sessions (id, email) VALUES ('{token}', '{email}')")
            mycon.commit()
            return {"success": True, "token": token}
        return {"success": False, "msg": "email or password is incorrect"}

    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(login({"email": "bingo@mail.com", "password": "123"}))


# Verifing OTP for account creation
def verifyOtp(body):
    try:
        # Checking if OTP present for given email
        myCursor.execute(f"SELECT * FROM verify WHERE email = '{body['email']}'")
        userData = myCursor.fetchone() or ""
        actualOtp = userData[4] if userData else False
        myCursor.reset()

        if not actualOtp:
            return {"success": False, "msg": "no otp send for this email"}

        # Checking if OTP is correct
        if actualOtp == body['otp']:
            # Creating user account
            myCursor.execute(f"INSERT INTO customers (name, number, email, password, location) VALUES ('{userData[0]}', '{userData[1]}', '{userData[2]}', '{userData[3]}', 'mumbai')")
            myCursor.execute(f"DELETE FROM verify WHERE email = '{body['email']}'")
            mycon.commit()
        else:
            return {"success": False, "msg": "Wrong OTP"}

        return login({"email": userData[2], "password": userData[3]}, True)
    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(verifyOtp({"email": "bingo@mail.com", "otp": '13664'}))


# Resending OTP
def resendOtp(body):
    try:
        # Creating OTP
        otp = ""
        for i in range(6):
            otp += str(randrange(0, 10))

        # Updating OTP for this email
        myCursor.execute(f"UPDATE verify SET otp = '{otp}' WHERE email = '{body['email']}'")
        mycon.commit()
        return {"success": True, "msg": "OTP resend successful"}

    except KeyError:
        return {"success": False, "msg": "missing field"}

# print(resendOtp({"email": "bingo@mail.com"}))


# Logout user account
def logout(body):
    try:
        # expiring session if any
        token = body['token']
        myCursor.execute(f"DELETE FROM sessions WHERE id = '{token}'")
        mycon.commit()
        return {"success": True, "msg": "token expired successfully"}
    except KeyError:
        return {"success": False, "msg": "missing field"}

# print(logout({"token": 'd60e18566187a70ac3456b35daf817d98cbeab1bd935998e79801678bfc860f5'}))


# Updating user info
def updateUser(body):

    # converting field to Sql query
    def createCmd(fields):
        retVal = ""
        for field in fields.keys():
            # if field value is empty don't include it
            if not fields[field]:
                continue
            retVal = f"{retVal} {field} = '{fields[field]}',"

        # removing "," after last entry
        return retVal[0:len(retVal)-1]

    try:
        # checking if token is valid
        email = tokenToMail(body['token'])
        if not email:
            return {"success": False, "msg": "Invalid token"}

        # including only necessary fields
        keys = dict(body)
        del keys['token']

        # updating user info
        myCursor.execute(f"UPDATE customers set {createCmd(keys)}  WHERE email = '{email}'")
        mycon.commit()
        return {"success": True, "msg": "account information updated"}

    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(updateUser({
#     "name": "Rahul Raja",
#     # "number": "8934756347",
#     # "profile_url": "",
#     "location": "klsdfj",
#     "token": "5255e3c8ebf89263edd83b961222bf62c0fe8264394deb4a6abb74198f268ea7"}
# ))


# Add to fav
def addToFav(body):
    try:
        myCursor.execute(f"SELECT email FROM sessions WHERE id = '{body['token']}'")
        email = myCursor.fetchone()
        if not email:
            return {"success": False, "msg": "Invalid token"}

        myCursor.execute(f"SELECT id, qty FROM products WHERE id = '{body['product_id']}'")
        product = myCursor.fetchone()
        if not product:
            return {"success": False, "msg": "Invalid product id"}
        
        myCursor.execute(f"SELECT fav FROM customers WHERE email = '{email[0]}'")
        fav = myCursor.fetchone()[0] or "[]"
        fav = json.loads(fav)

        for item in fav:
            if item == body['product_id']:
                return {"success": True, "msg": "product added to fav"}
        
        fav.append(body['product_id'])
        myCursor.execute(f"UPDATE customers SET fav = '{json.dumps(fav)}' WHERE email = '{email[0]}'")
        mycon.commit()
        return {"success": True, "msg": "product added to fav"}

    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(addToFav({"token": "7da43360d73ad3f1ad8de5f1ddc1be956466b5c78bf1f258946c2bb169ada11f", "product_id": "63acc2353f"}))


# Delete From Fav
def delToFav(body):
    try:
        myCursor.execute(f"SELECT email FROM sessions WHERE id = '{body['token']}'")
        email = myCursor.fetchone()
        if not email:
            return {"success": False, "msg": "Invalid token"}
        
        myCursor.execute(f"SELECT fav FROM customers WHERE email = '{email[0]}'")
        fav = myCursor.fetchone()[0] or "[]"
        fav = json.loads(fav)

        index = 0
        while index < len(fav):
            if fav[index] == body['product_id']:
                del fav[index]
                break
            index += 1

        myCursor.execute(f"UPDATE customers SET fav = '{json.dumps(fav)}' WHERE email = '{email[0]}'")
        mycon.commit()
        return {"success": True, "msg": "product deleted from fav"}

    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(delToFav({"token": "7da43360d73ad3f1ad8de5f1ddc1be956466b5c78bf1f258946c2bb169ada11f", "product_id": "b2ff3364ac"}))


# Add to cart
def addToCart(body):
    try:
        myCursor.execute(f"SELECT email FROM sessions WHERE id = '{body['token']}'")
        email = myCursor.fetchone()
        if not email:
            return {"success": False, "msg": "Invalid token"}

        myCursor.execute(f"SELECT id, qty FROM products WHERE id = '{body['product_id']}'")
        product = myCursor.fetchone()
        if not product:
            return {"success": False, "msg": "Invalid product id"}

        myCursor.execute(f"SELECT cart FROM customers WHERE email = '{email[0]}'")
        cart = myCursor.fetchone()[0] or "[]"
        cart = json.loads(cart)

        itemAlreadyInCart = False

        index = 0
        while index < len(cart):
            if(cart[index]['pid'] == product[0]):
                itemAlreadyInCart = True
                newQty = int(body['qty'])
                if newQty > product[1] or newQty < 0:
                    return {"success": False, "msg": "Qty out of range"}

                if newQty <= 0:
                    del cart[index]
                    break
                
                cart[index]['qty'] = newQty
                break
            index += 1

        if not itemAlreadyInCart and int(body['qty']) > 0:
            cart.append({'pid': product[0], 'qty': body['qty']})

        myCursor.execute(f"UPDATE customers SET cart = '{json.dumps(cart)}' WHERE email = '{email[0]}'")
        mycon.commit()
        if (body['qty']>=1):
            return {"success": True, "msg": "product added to cart"}
        else:
            return {"success": True, "msg": "product deleted from cart"}

    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(addToCart({"token": "7da43360d73ad3f1ad8de5f1ddc1be956466b5c78bf1f258946c2bb169ada11f", "product_id": "efe9752e51", "qty": -20}))
# print(addToCart({"token": "7da43360d73ad3f1ad8de5f1ddc1be956466b5c78bf1f258946c2bb169ada11f", "product_id": "b2ff3364ac", "qty": -2}))