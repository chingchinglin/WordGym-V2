// 測試 Claude Auto-Fix 的檔案
// 故意加入多個 lint 和 format 錯誤

const unusedVariable = "test"; // 未使用變數 + 多餘空格
const anotherUnused = 123; // 缺少分號 + 多餘空格

function badlyFormattedFunction() {
  // 多餘空格
  console.log("bad formatting"); // 不一致縮排 + 多餘空格
  return "test"; // 多餘空格
}

const obj = { key: "value", another: "value" }; // 缺少空格
const arr = [1, 2, 3, 4, 5]; // 缺少空格

// 未使用的函數
function neverCalled() {
  return 42;
}

export {}; // 避免被視為非 module
