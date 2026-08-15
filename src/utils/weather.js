// 16 方位风向英文缩写转中文（wttr.in 返回的是英文风向）
export const windDirZh = (dir) => {
  if (!dir) return "未知";
  const map = {
    N: "北风",
    NNE: "北东北风",
    NE: "东北风",
    ENE: "东东北风",
    E: "东风",
    ESE: "东东南风",
    SE: "东南风",
    SSE: "南东南风",
    S: "南风",
    SSW: "南西南风",
    SW: "西南风",
    WSW: "西西南风",
    W: "西风",
    WNW: "西西北风",
    NW: "西北风",
    NNW: "北西北风",
  };
  return map[dir.trim().toUpperCase()] || dir;
};
