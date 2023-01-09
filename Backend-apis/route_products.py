import math
import json
import connection
from hashlib import sha256
from random import randrange
from route_admin import checkAdmin
from route_customers import tokenToMail

# Getting DB connection
mycon, myCursor = connection.getConnection()
myCursor.execute("USE kuchbhi")


# Adding Product
def addProduct(body):
    try:
        # Checking if token have admin authorization
        check = checkAdmin(body['token']) 
        if not check['success']:
            return check

        # creating product id
        randomString = f"{randrange(0, 100)} {body['title']} {randrange(0, 100)} {body['qty']}"
        id = sha256(randomString.encode()).hexdigest()[0:10]

        # creating product
        myCursor.execute(f"INSERT INTO products VALUES('{id}', '{body['title']}', '{body['desc']}', {body['price']}, {body['qty']}, {body['review_count']}, {body['stars']}, '{json.dumps(body['product_imgs'])}')")
        mycon.commit()

        return {"success": True, "msg": "product successfully added"}

    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(addProduct({
#     "title": "Washing machine",
#     "desc": "Intel Dual-Core Processor",
#     "review_count": 240,
#     "stars": 4,
#     "price": 20000,
#     "qty": 50,
#     "product_imgs": "asdf - JSON",
#     "token": "fc3cb7c3a6ff1f9bab3e2763294e57819054b2c29b327504c1fd5639a4734c97"
# }))


# Deleting product
def deleteProduct(body):
    try:
        # Checking if token have admin authorization
        check = checkAdmin(body['token']) 
        if not check['success']:
            return check

        # Deleting product using id
        myCursor.execute(f"DELETE from products WHERE id = '{body['product_id']}'")
        myCursor.execute(f"DELETE from orders WHERE product_id = '{body['product_id']}'")
        mycon.commit()
        return {"success": True, "msg": "product successfully deleted"}
    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(deleteProduct({"token": "7a879f011c8e15287d471166687bd96a1b68fd67c9afaf86564f5832335a3669", "product_id": "ddc1e40358"}))

# Update product Info


# Updating product
def updateProduct(body):

    # converting field to Sql query
    def createCmd(fields):
        retVal = ""
        for field in fields.keys():
            # if field value is empty don't include it
            if not fields[field]:
                continue

            # Seprating based on field value type
            valType = str(type(fields[field]))
            if 'str' in valType:
                retVal = f"{retVal} {field} = '{fields[field]}',"
            elif 'list' in valType:
                retVal = f"{retVal} {field} = '{json.dumps(fields[field])}',"
            else:
                retVal = f"{retVal} {field} = {fields[field]},"

        # removing "," after last entry
        return retVal[0:len(retVal)-1]

    try:
        # Checking if token have admin authorization
        check = checkAdmin(body['token']) 
        if not check['success']:
            return check

        # Checking if product with id exists
        myCursor.execute(f"SELECT * FROM products WHERE id = '{body['product_id']}'")
        savedFields = myCursor.fetchall()
        if not savedFields:
            return {"success": False, "msg": "product not found"}

        # including only necessary fields
        keys = dict(body)
        del keys['token']
        del keys['product_id']
        myCursor.reset()

        # updating product info
        myCursor.execute(f"UPDATE products set {createCmd(keys)}  WHERE id = '{body['product_id']}'")
        mycon.commit()
        return {"success": True, "msg": "product updated"}
    except KeyError:
        return {"success": False, "msg": "missing fields"}

# print(updateProduct({
#     "title": "2021 New HP 15 Macbook",
#     "description": "Producessor",
#     # "review_count": 500,
#     "stars": 3,
# #     "price": 40000,
# #     "qty": 50,
#     # "product_imgs": "asdf - JSON",
#     "product_id": "3f3417a802",
#     "token": "7a879f011c8e15287d471166687bd96a1b68fd67c9afaf86564f5832335a3669"
# }))


# Getting Product Information
def getProduct(body):
    try:
        myCursor.execute(f"SELECT title, description, review_count, stars, price, qty, product_imgs FROM products WHERE id = '{body['product_id']}'")
        data = myCursor.fetchone()

        # if no record found
        if not data:
            return {"success": False, "msg": f"product with id {body['product_id']} not found"}
        
        # if record exists
        return {
            "success": True,
            "data": {
                "title": data[0],
                "description": data[1],
                "review_count": data[2],
                "stars": data[3],
                "price": data[4],
                "qty": data[5],
                "product_imgs": json.loads(data[6])
            }
        }

    except KeyError:
        return {"success": False, "msg": "missing field"}

# print(getProduct({"product_id": '3f3417a802'}))


# product searching
def searchingProduct(body):
    def conditions():
        if 'review' in body.keys():
            if body['review'] == 'hl':
                return "ORDER BY review_count DESC"
            elif body['review'] == 'lh':
                return "ORDER BY review_count"

        if 'qty' in body.keys():
            if body['qty'] == 'hl':
                return "ORDER BY qty DESC"
            elif body['qty'] == 'lh':
                return "ORDER BY qty"

        if 'price' in body.keys():
            if body['price'] == 'hl':
                return "ORDER BY price DESC"
            elif body['price'] == 'lh':
                return "ORDER BY price"
        

    def pageing(products):
        pageSize = 1
        pageNum = 1

        try:
            if 'page_size' in body.keys():
                pageSize = int(body['page_size'])

            if 'page_num' in body.keys():
                if pageNum < int(body['page_num']): 
                    pageNum = int(body['page_num'])
        except ValueError:
            return {"success": False, "msg": "Invalid parameters"}

        totalPages = math.ceil(len(products)/pageSize)
        result = []

        for i in range((pageNum-1)*pageSize, pageNum*pageSize):
            try:
                result.append(products[i])
            except Exception:
                break
        
        formatedResult = []
        for product in result:
            formatedResult.append({
                "id": product[0],
                "title": product[1],
                "desc": product[2],
                "price": product[3],
                "qty": product[4],
                "review_count": product[5],
                "stars": product[6],
                "product_imgs": json.loads(product[7])
            })
        
        return {"data": formatedResult, "totalPages": totalPages, "currentPage": pageNum, "pageSize": pageSize}

    def markFavProducts(slicedList):
        # Checking if token is valid
        email = tokenToMail(body["token"])
        if not email:
            return slicedList

        myCursor.execute(f"SELECT fav FROM customers WHERE email = '{email}'")
        favProducts = myCursor.fetchone()
        if not favProducts:
            return slicedList
        
        favProducts = favProducts[0]
        allFav = json.loads(favProducts or "[]")
        for p in slicedProducts:
            if p['id'] in allFav:
                p["fav"] = True
            else:
                p["fav"] = False
        
        return slicedList


    try:
        filters = conditions() or ""
        if body['title'] == '':
            myCursor.execute(f"SELECT * FROM products {filters}")
        else:
            myCursor.execute(f"SELECT * FROM products WHERE title LIKE '%{body['title']}%' {filters}")
        
        allProducts = myCursor.fetchall()
        pageInfo = pageing(allProducts)
        slicedProducts = pageInfo['data']
        if 'token' in body.keys():
            slicedProducts = markFavProducts(slicedProducts)

        return {
            'success': True,
            'products': slicedProducts,
            'total_pages': pageInfo['totalPages'],
            'current_page': pageInfo['currentPage'],
            'page_size': pageInfo['pageSize']
        }
    except KeyError:
        return {"success": False, "msg": "missing fields"}
    except Exception:
        return {"success": False, "msg": "invalid title"}

# print(searchingProduct({
#     "title": "",
#     'price': 'hl',
#     "page_num": "1",
#     'page_size': '8'.
#     'token': '8'
# }))