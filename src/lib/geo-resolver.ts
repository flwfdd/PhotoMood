interface CityEntry {
  name: string
  country: string
  lat: number
  lng: number
}

const CITIES: CityEntry[] = [
  { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
  { name: 'Guangzhou', country: 'China', lat: 23.1291, lng: 113.2644 },
  { name: 'Shenzhen', country: 'China', lat: 22.5431, lng: 114.0579 },
  { name: 'Chengdu', country: 'China', lat: 30.5728, lng: 104.0668 },
  { name: 'Hangzhou', country: 'China', lat: 30.2741, lng: 120.1551 },
  { name: 'Wuhan', country: 'China', lat: 30.5928, lng: 114.3055 },
  { name: 'Xi\'an', country: 'China', lat: 34.3416, lng: 108.9398 },
  { name: 'Nanjing', country: 'China', lat: 32.0603, lng: 118.7969 },
  { name: 'Chongqing', country: 'China', lat: 29.5630, lng: 106.5516 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
]

const CITY_NAMES_ZH: Record<string, string> = {
  'Beijing': '北京',
  'Shanghai': '上海',
  'Guangzhou': '广州',
  'Shenzhen': '深圳',
  'Chengdu': '成都',
  'Hangzhou': '杭州',
  'Wuhan': '武汉',
  "Xi'an": '西安',
  'Nanjing': '南京',
  'Chongqing': '重庆',
  'Tokyo': '东京',
  'Osaka': '大阪',
  'Seoul': '首尔',
  'Bangkok': '曼谷',
  'Singapore': '新加坡',
  'New York': '纽约',
  'Los Angeles': '洛杉矶',
  'London': '伦敦',
  'Paris': '巴黎',
  'Berlin': '柏林',
  'Sydney': '悉尼',
  'Toronto': '多伦多',
  'Dubai': '迪拜',
  'Mumbai': '孟买',
  'Moscow': '莫斯科',
}

const COUNTRY_NAMES_ZH: Record<string, string> = {
  'China': '中国',
  'Japan': '日本',
  'South Korea': '韩国',
  'Thailand': '泰国',
  'Singapore': '新加坡',
  'USA': '美国',
  'UK': '英国',
  'France': '法国',
  'Germany': '德国',
  'Australia': '澳大利亚',
  'Canada': '加拿大',
  'UAE': '阿联酋',
  'India': '印度',
  'Russia': '俄罗斯',
}

function toRad(deg: number) { return (deg * Math.PI) / 180 }

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function resolveLocation(lat: number, lng: number, locale: string): string {
  let nearest: CityEntry | null = null
  let minDist = Infinity

  for (const city of CITIES) {
    const dist = haversineDistance(lat, lng, city.lat, city.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = city
    }
  }

  if (!nearest || minDist > 500) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  if (locale.startsWith('zh')) {
    const cityZh = CITY_NAMES_ZH[nearest.name] ?? nearest.name
    const countryZh = COUNTRY_NAMES_ZH[nearest.country] ?? nearest.country
    return `${cityZh}, ${countryZh}`
  }

  return `${nearest.name}, ${nearest.country}`
}
