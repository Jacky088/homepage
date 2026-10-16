/**
 * 气象数据格式化与专业术语词典
 * 符合中国气象局（CMA）《地面气象观测规范》与专业天气预报播报标准
 */

/**
 * 统一风力格式
 * uapis / 高德返回的风力可能自带单位（如 "2级"、""），
 * 界面渲染时统一避免出现「2级 级」
 */
export const normalizeWindPower = (power) => {
  if (power === null || power === undefined) return "";
  return String(power).replace(/级$/, "").trim();
};

/**
 * 16 方位风向英文缩写转中文（wttr.in 等外部数据源）
 */
export const windDirZh = (dir) => {
  if (!dir) return "微风";
  const map = {
    N: "北风",
    NNE: "东北偏北风",
    NE: "东北风",
    ENE: "东北偏东风",
    E: "东风",
    ESE: "东南偏东风",
    SE: "东南风",
    SSE: "东南偏南风",
    S: "南风",
    SSW: "西南偏南风",
    SW: "西南风",
    WSW: "西南偏西风",
    W: "西风",
    WNW: "西北偏西风",
    NW: "西北风",
    NNW: "西北偏北风",
  };
  return map[dir.trim().toUpperCase()] || dir;
};

/**
 * 专业天气播报中文词典纠正与规范化
 * 将口语化、生硬直译词汇（如「烟雾」「薄雾」「局部多云」「附近有雷暴」）
 * 规范为气象台标准播报术语（如「霾」「轻雾」「晴间多云」「雷阵雨」）
 */
const WEATHER_STANDARDIZED_MAP = {
  // 雾霾与大气混浊
  烟雾: "霾",
  烟霾: "霾",
  薄雾: "轻雾",
  阴天: "阴",
  晴天: "晴",
  少云: "晴间多云",
  局部多云: "晴间多云",

  // 降水与对流天气（气象台播报标准）
  附近有零星降雨: "局部阵雨",
  附近有零星降雪: "局部阵雪",
  附近有零星雨夹雪: "局部雨夹雪",
  附近有零星冻毛毛雨: "零星冻雨",
  附近有雷暴: "雷阵雨",
  附近有零星雷雨: "局部雷阵雨",
  附近有中到大雷雨: "雷阵雨",
  附近有零星雷雪: "局部雷阵雪",
  附近有中到大雷雪: "雷阵雪",
  时有中雨: "阵性中雨",
  时有大雨: "阵性大雨",
  零星小毛毛雨: "毛毛雨",
  小毛毛雨: "毛毛雨",
  强冻毛毛雨: "冻毛毛雨",
  特大阵雨: "极端暴雨",
  小阵冰粒: "冰粒",
  中到大阵冰粒: "冰粒",
  中到大雨夹雪: "雨夹雪",
  中到大冻雨: "冻雨",
  小冻雨: "冻雨",
};

/**
 * 规范化天气文本（无论是中文接口返回还是机翻结果）
 */
export const normalizeWeatherZh = (text) => {
  if (!text) return "";
  const trimmed = text.trim();
  if (WEATHER_STANDARDIZED_MAP[trimmed]) {
    return WEATHER_STANDARDIZED_MAP[trimmed];
  }
  // 包含"烟雾"或"烟霾"统一转换为"霾"
  if (trimmed === "烟雾" || trimmed === "烟霾") return "霾";
  return trimmed;
};

/**
 * 高德天气描述转中文
 */
export const amapWeatherZh = (weather) => {
  if (!weather) return "";
  return normalizeWeatherZh(weather);
};

/**
 * wttr.in / WWO (World Weather Online) 天气代码英文转专业气象播报中文
 */
const WTTR_WEATHER_MAP = {
  Sunny: "晴",
  Clear: "晴",
  "Partly Cloudy": "晴间多云",
  "Partly cloudy": "晴间多云",
  Cloudy: "多云",
  Overcast: "阴",
  Mist: "轻雾",
  Fog: "大雾",
  "Freezing fog": "冻雾",
  "Dense fog": "浓雾",

  // 霾 / 烟雾（专业气象归类为霾）
  Haze: "霾",
  "Smoky haze": "霾",
  Smoke: "霾",
  Smoky: "霾",

  // 降水
  "Patchy rain nearby": "局部阵雨",
  "Patchy rain possible": "局部阵雨",
  "Patchy snow nearby": "局部阵雪",
  "Patchy snow possible": "局部阵雪",
  "Patchy sleet nearby": "局部雨夹雪",
  "Patchy sleet possible": "局部雨夹雪",
  "Patchy freezing drizzle nearby": "零星冻雨",
  "Thundery outbreaks in nearby": "雷阵雨",
  "Thundery outbreaks possible": "雷阵雨",

  // 雨
  "Patchy light drizzle": "毛毛雨",
  "Light drizzle": "毛毛雨",
  Drizzle: "毛毛雨",
  "Freezing drizzle": "冻毛毛雨",
  "Heavy freezing drizzle": "冻毛毛雨",
  "Patchy light rain": "分散小雨",
  "Light rain": "小雨",
  "Moderate rain at times": "阵性中雨",
  "Moderate rain": "中雨",
  "Heavy rain at times": "阵性大雨",
  "Heavy rain": "大雨",
  "Light rain shower": "小阵雨",
  "Moderate or heavy rain shower": "阵雨",
  "Torrential rain shower": "极端暴雨",

  // 冻雨 / 雨夹雪
  "Light freezing rain": "小冻雨",
  "Moderate or heavy freezing rain": "冻雨",
  "Light sleet": "小雨夹雪",
  "Moderate or heavy sleet": "雨夹雪",
  "Light sleet showers": "雨夹雪",
  "Moderate or heavy sleet showers": "雨夹雪",

  // 雪
  "Blowing snow": "吹雪",
  Blizzard: "暴风雪",
  "Patchy light snow": "分散小雪",
  "Light snow": "小雪",
  "Patchy moderate snow": "中雪",
  "Moderate snow": "中雪",
  "Patchy heavy snow": "大雪",
  "Heavy snow": "大雪",
  "Light snow showers": "小阵雪",
  "Moderate or heavy snow showers": "阵雪",

  // 冰雹与对流
  "Ice pellets": "冰粒",
  "Light showers of ice pellets": "冰粒",
  "Moderate or heavy showers of ice pellets": "冰粒",
  "Patchy light rain in area with thunder": "局部雷阵雨",
  "Moderate or heavy rain in area with thunder": "雷阵雨",
  "Patchy light snow in area with thunder": "局部雷阵雪",
  "Moderate or heavy snow in area with thunder": "雷阵雪",

  // 沙尘
  Dust: "浮尘",
  "Blowing dust": "扬沙",
  Sandstorm: "沙尘暴",
  "Severe sandstorm": "强沙尘暴",
};

export const wttrWeatherZh = (text) => {
  if (!text) return "";
  const key = text.trim();
  if (WTTR_WEATHER_MAP[key]) return WTTR_WEATHER_MAP[key];

  // 忽略大小写匹配
  const lowerKey = key.toLowerCase();
  for (const k in WTTR_WEATHER_MAP) {
    if (k.toLowerCase() === lowerKey) {
      return WTTR_WEATHER_MAP[k];
    }
  }

  // 若已经是中文，执行规范化
  return normalizeWeatherZh(key);
};
