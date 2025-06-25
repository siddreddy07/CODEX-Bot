loopsum.js

# Calculate Sum Function
```javascript
function calculateSum(limit) {
  let sum = 0;
  for (let i = 1; i <= limit; i++) {
    sum += i;
  }
  return sum;
}

console.log(calculateSum(5));
```
The `calculateSum` function calculates the sum of all integers from 1 to a given `limit`. It iterates over the range using a for loop, adding each number to a running total, and returns the final sum.

This function is used in the provided code snippet to calculate the sum of numbers from 1 to 5 and log the result to the console.

**Generated on: 24/6/2025 - 11:14:10 am**