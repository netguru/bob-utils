module.exports = object => Object.entries(object).reduce((arr, [key, value]) => {
  arr.push({
    name: key,
    ...value,
  });
  return arr;
}, []);
