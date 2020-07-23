const haveSameElements = (arr1 = [], arr2 = []) => {
  for (let i = 0; i < arr1.length; i += 1) if (arr2.indexOf(arr1[i]) === -1) return false;
  for (let i = 0; i < arr2.length; i += 1) if (arr1.indexOf(arr2[i]) === -1) return false;
  return true;
};

module.exports = { haveSameElements };
