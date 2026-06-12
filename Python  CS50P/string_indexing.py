name = input("What is your username?: ")

if len(name) > 12 :
    print("Sorry, your username is too long.")
elif not name.find(" ") == -1 :
    print("Sorry, your username can't contain any spaces.")
elif not name.isdigit() == True :
    print("Sorry, your username can't contain any digits.")
else :
    print(f"Welcome {name}! ")

