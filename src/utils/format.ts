export function formatNumber(num) {
  // 将数字转化为字符串
  let numStr = Number(num).toFixed(20);
  // 找到小数点的位置
  const decimalIndex = numStr.indexOf('.');

  // 如果没有小数点，说明是整数，直接返回两位小数
  if (decimalIndex === -1) {
    return Number(Number(num).toFixed(2));
  }

  // 获取整数部分和小数部分
  const integerPart = numStr.substring(0, decimalIndex);
  let decimalPart = numStr.substring(decimalIndex + 1);

  // 如果整数部分不等于0，保留两位小数
  if (parseInt(integerPart) !== 0) {
    return Number(Number(num).toFixed(2));
  }

  // 如果整数部分为0，找出第一个不为0的小数部分
  let firstNonZeroIndex = -1;
  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] !== '0') {
      firstNonZeroIndex = i;
      break;
    }
  }

  // 如果没有非零数字或者第一位就是非零，保留两位小数返回
  if (firstNonZeroIndex < 2 ) {
    return Number(Number(num).toFixed(2));
  }

  // 保留第一个非零数字及其后的数字
  decimalPart = decimalPart.substring(0, firstNonZeroIndex + 1);

  // 返回整数部分和格式化后的浮动部分
  return parseFloat(integerPart + '.' + decimalPart);
}
