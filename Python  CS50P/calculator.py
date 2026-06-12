#Python calculator

operator = input("Choose your operator (+, -, *, /): ")
num_1 = float(input("Enter your 1st number: "))
num_2 = float(input("Enter your 2nd number: "))

if operator == "+":
    print(f"{num_1} + {num_2}")
    result = num_1 + num_2
    print(f"The result is {result}")
elif operator == "-":
    print(f"{num_1} - {num_2}")
    result = num_1 - num_2
    print(f"The result is {result}")
elif operator == "*":
    print(f"{num_1} * {num_2}")
    result = num_1 * num_2
    print(f"The result is {result}")
elif operator == "/":
    print(f"{num_1} / {num_2}")
    result = num_1 / num_2
    print(f"The result is {result}")
else:
    print("Invalid operator")