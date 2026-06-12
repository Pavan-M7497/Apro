item = input("What item would you like to buy?: ")
price = float(input("What's the price? "))
quantity = int(input("What's the quantity? "))
total_price = price * quantity

print(f"You have bought {quantity} of {item}")
print(f"The total price is {total_price}")