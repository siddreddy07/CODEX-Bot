const product = {
  title: "Smartphone",
  price: 19999,
  displayDetails: () => {
    console.log("Product: " + this.title + ", Price: ₹" + this.price);
  }
};

product.displayDetails();
