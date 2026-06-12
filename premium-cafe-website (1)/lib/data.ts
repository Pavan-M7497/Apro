export interface Location {
  id: string
  name: string
  shortName: string
  address: string
  city: string
  vibe: string
  image: string
  mapUrl: string
  phone: string
  email: string
  instagram: string
  swiggyUrl: string
  zomatoUrl: string
  hours: {
    weekday: string
    weekend: string
  }
  coordinates: {
    lat: number
    lng: number
  }
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  featured?: boolean
  /** When false, item is hidden on public menu (managed from admin). */
  available?: boolean
  dietary?: ('vegetarian' | 'vegan' | 'gluten-free')[]
}

/** Hero / SEO — Bangalore positioning */
export const BANGALORE_TAGLINE =
  "Serving Bangalore's best breakfast & brunch experience."

/** Shown on menu and checkout-adjacent UI */
export const GST_NOTE =
  'Prices are listed in Indian Rupees (₹) and are exclusive of applicable GST, where applicable. UPI, cards & wallets accepted at the cafe.'

export const DEFAULT_SWIGGY_URL = 'https://swiggy.com'
export const DEFAULT_ZOMATO_URL = 'https://zomato.com'

export interface Review {
  id: string
  author: string
  rating: number
  text: string
  date: string
  locationId: string
  source: 'Google' | 'Zomato'
  avatar?: string
}

export const locations: Location[] = [
  {
    id: 'indiranagar',
    name: '154 Indiranagar',
    shortName: 'Indiranagar',
    address: '154, 12th Main Road, HAL 2nd Stage',
    city: 'Indiranagar, Bangalore 560038',
    vibe: 'Urban sophistication meets cozy warmth. Perfect for morning meetings and creative souls.',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    mapUrl: 'https://maps.google.com/?q=154+12th+Main+Road+Indiranagar+Bangalore',
    phone: '+91 80 4567 0154',
    email: 'indiranagar@154breakfastclub.in',
    instagram: '@154indiranagar',
    swiggyUrl: DEFAULT_SWIGGY_URL,
    zomatoUrl: DEFAULT_ZOMATO_URL,
    hours: {
      weekday: '8:00 AM - 10:00 PM',
      weekend: '8:00 AM - 11:00 PM'
    },
    coordinates: {
      lat: 12.9784,
      lng: 77.6408
    }
  },
  {
    id: 'koramangala',
    name: '154 Koramangala',
    shortName: 'Koramangala',
    address: '287, 5th Block, 80 Feet Road',
    city: 'Koramangala, Bangalore 560095',
    vibe: 'Elevated brunch with vibrant energy. Where startups meet and ideas brew.',
    image: 'https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800&q=80',
    mapUrl: 'https://maps.google.com/?q=287+80+Feet+Road+Koramangala+Bangalore',
    phone: '+91 80 4567 0287',
    email: 'koramangala@154breakfastclub.in',
    instagram: '@154koramangala',
    swiggyUrl: DEFAULT_SWIGGY_URL,
    zomatoUrl: DEFAULT_ZOMATO_URL,
    hours: {
      weekday: '8:00 AM - 10:30 PM',
      weekend: '8:00 AM - 11:00 PM'
    },
    coordinates: {
      lat: 12.9352,
      lng: 77.6245
    }
  },
  {
    id: 'hsr-layout',
    name: '154 HSR Layout',
    shortName: 'HSR Layout',
    address: '42, 27th Main Road, Sector 1',
    city: 'HSR Layout, Bangalore 560102',
    vibe: 'Sunlit sanctuary with lush greenery. The perfect escape for mindful mornings.',
    image: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80',
    mapUrl: 'https://maps.google.com/?q=42+27th+Main+Road+HSR+Layout+Bangalore',
    phone: '+91 80 4567 0042',
    email: 'hsrlayout@154breakfastclub.in',
    instagram: '@154hsrlayout',
    swiggyUrl: DEFAULT_SWIGGY_URL,
    zomatoUrl: DEFAULT_ZOMATO_URL,
    hours: {
      weekday: '8:00 AM - 10:00 PM',
      weekend: '9:00 AM - 11:00 PM'
    },
    coordinates: {
      lat: 12.9116,
      lng: 77.6389
    }
  },
  {
    id: 'whitefield',
    name: '154 Whitefield',
    shortName: 'Whitefield',
    address: '88, Varthur Main Road, Siddapura',
    city: 'Whitefield, Bangalore 560066',
    vibe: 'Garden-city energy with airy glass, work-friendly corners, and long brunches that stretch into the evening.',
    image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
    mapUrl: 'https://maps.google.com/?q=Varthur+Main+Road+Whitefield+Bangalore',
    phone: '+91 80 4567 0088',
    email: 'whitefield@154breakfastclub.in',
    instagram: '@154whitefield',
    swiggyUrl: DEFAULT_SWIGGY_URL,
    zomatoUrl: DEFAULT_ZOMATO_URL,
    hours: {
      weekday: '8:00 AM - 10:00 PM',
      weekend: '8:00 AM - 11:00 PM'
    },
    coordinates: {
      lat: 12.9698,
      lng: 77.7499
    }
  },
  {
    id: 'jp-nagar',
    name: '154 JP Nagar',
    shortName: 'JP Nagar',
    address: '21, 24th Main, 7th Phase',
    city: 'JP Nagar, Bangalore 560078',
    vibe: 'Neighbourhood cafe charm — filter kaapi mornings, sourdough evenings, and the hum of Bangalore just outside.',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80',
    mapUrl: 'https://maps.google.com/?q=24th+Main+JP+Nagar+Bangalore',
    phone: '+91 80 4567 0021',
    email: 'jpnagar@154breakfastclub.in',
    instagram: '@154jpnagar',
    swiggyUrl: DEFAULT_SWIGGY_URL,
    zomatoUrl: DEFAULT_ZOMATO_URL,
    hours: {
      weekday: '8:00 AM - 10:00 PM',
      weekend: '8:00 AM - 11:00 PM'
    },
    coordinates: {
      lat: 12.9063,
      lng: 77.5927
    }
  }
]

export const menuItems: MenuItem[] = [
  // Breakfast
  {
    id: 'classic-pancakes',
    name: 'Buttermilk Pancakes',
    description: 'Fluffy stack with maple syrup, whipped butter, and fresh berries',
    price: 349,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    featured: true,
    dietary: ['vegetarian']
  },
  {
    id: 'avocado-toast',
    name: 'Avocado Toast',
    description: 'Smashed avocado on sourdough with poached eggs, chili flakes, and microgreens',
    price: 399,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600&q=80',
    featured: true,
    dietary: ['vegetarian']
  },
  {
    id: 'belgian-waffles',
    name: 'Belgian Waffles',
    description: 'Crispy golden waffles with house-made berry compote and cream',
    price: 329,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80',
    dietary: ['vegetarian']
  },
  {
    id: 'eggs-benedict',
    name: 'Eggs Benedict',
    description: 'Poached eggs on brioche with smoked salmon and hollandaise',
    price: 449,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1608039829572-9b1234ef409c?w=600&q=80',
    featured: true
  },
  {
    id: 'brunch-platter',
    name: 'The 154 Platter',
    description: 'Eggs your way, artisan bacon, roasted tomatoes, mushrooms, and sourdough',
    price: 549,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1533920379810-6bedac961555?w=600&q=80'
  },
  {
    id: 'masala-omelette',
    name: 'Masala Omelette',
    description: 'Fluffy eggs with onions, tomatoes, green chilies, and coriander served with toast',
    price: 249,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80',
    dietary: ['vegetarian']
  },
  {
    id: 'acai-bowl',
    name: 'Acai Power Bowl',
    description: 'Blended acai with granola, fresh fruits, coconut, and honey drizzle',
    price: 379,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80',
    dietary: ['vegan', 'gluten-free']
  },
  {
    id: 'french-toast',
    name: 'Brioche French Toast',
    description: 'Thick-cut brioche with caramelized bananas and cinnamon cream',
    price: 349,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80',
    dietary: ['vegetarian']
  },
  {
    id: 'shakshuka',
    name: 'Shakshuka',
    description: 'Poached eggs in spiced tomato sauce with feta and warm pita',
    price: 349,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80',
    dietary: ['vegetarian']
  },
  {
    id: 'idli-sambar',
    name: 'Organic Idli Platter',
    description: 'Steamed rice cakes with sambar, coconut chutney, and filter coffee',
    price: 199,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&q=80',
    dietary: ['vegan', 'gluten-free']
  },
  // Coffee
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Double shot with velvety milk foam and latte art',
    price: 179,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80',
    featured: true
  },
  {
    id: 'signature-latte',
    name: 'Signature Latte',
    description: 'House-made oat milk with single origin espresso and vanilla',
    price: 219,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
    featured: true,
    dietary: ['vegan']
  },
  {
    id: 'cold-brew',
    name: 'Cold Brew',
    description: '18-hour slow steeped with notes of chocolate and caramel',
    price: 199,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80',
    dietary: ['vegan']
  },
  {
    id: 'filter-coffee',
    name: 'South Indian Filter Coffee',
    description: 'Traditional brass tumbler with freshly ground Chikmagalur beans',
    price: 99,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1497515114889-1f074b30e68e?w=600&q=80',
    featured: true
  },
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'Single origin from Coorg with bright citrus notes',
    price: 149,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80',
    dietary: ['vegan']
  },
  {
    id: 'mocha',
    name: 'Mocha',
    description: 'Rich espresso with Belgian chocolate and steamed milk',
    price: 229,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80',
    dietary: ['vegetarian']
  },
  {
    id: 'matcha-latte',
    name: 'Matcha Latte',
    description: 'Ceremonial grade matcha with oat milk and honey',
    price: 249,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&q=80',
    dietary: ['vegetarian']
  },
  {
    id: 'chai-latte',
    name: 'Masala Chai Latte',
    description: 'Spiced chai with cardamom, ginger, and steamed milk',
    price: 149,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&q=80',
    dietary: ['vegetarian']
  },
  // Desserts
  {
    id: 'chocolate-brownie',
    name: 'Fudge Brownie',
    description: 'Warm chocolate brownie with vanilla ice cream and caramel',
    price: 279,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80',
    featured: true,
    dietary: ['vegetarian']
  },
  {
    id: 'cheesecake',
    name: 'Baked Cheesecake',
    description: 'Classic creamy cheesecake with berry coulis',
    price: 329,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80',
    dietary: ['vegetarian']
  },
  {
    id: 'croissant',
    name: 'Butter Croissant',
    description: 'Flaky French pastry with premium butter, baked fresh daily',
    price: 149,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
    dietary: ['vegetarian']
  },
  {
    id: 'tiramisu',
    name: 'Tiramisu',
    description: 'Espresso-soaked ladyfingers with mascarpone and cocoa',
    price: 349,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80',
    dietary: ['vegetarian']
  },
  {
    id: 'gulab-jamun',
    name: 'Gulab Jamun Cheesecake',
    description: 'Fusion dessert with rose-cardamom cream and pistachio',
    price: 349,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1627308595216-439c00ade0fe?w=600&q=80',
    dietary: ['vegetarian']
  }
]

export const reviews: Review[] = [
  {
    id: '1',
    author: 'Priya S.',
    rating: 5,
    text: 'The atmosphere here is absolutely unmatched. Perfect for a cozy date or focused work session. The avocado toast is divine!',
    date: '2 weeks ago',
    locationId: 'indiranagar',
    source: 'Google'
  },
  {
    id: '2',
    author: 'Rahul K.',
    rating: 5,
    text: 'Best brunch spot in Bangalore. The 154 Platter is a must-try. Staff is incredibly warm and the filter coffee is exceptional.',
    date: '1 month ago',
    locationId: 'indiranagar',
    source: 'Google'
  },
  {
    id: '3',
    author: 'Ananya R.',
    rating: 5,
    text: 'Finally found my go-to cafe! The interiors are Instagram-worthy and the food backs up the aesthetic. 10/10.',
    date: '3 weeks ago',
    locationId: 'koramangala',
    source: 'Zomato'
  },
  {
    id: '4',
    author: 'Vikram T.',
    rating: 5,
    text: 'Great for startup meetings! Came for coffee, stayed for the ambiance. Their signature latte changed my life.',
    date: '1 week ago',
    locationId: 'koramangala',
    source: 'Zomato'
  },
  {
    id: '5',
    author: 'Sneha M.',
    rating: 5,
    text: 'As a remote worker, I appreciate how peaceful and welcoming this space is. Great WiFi, better pastries, perfect acoustics.',
    date: '2 months ago',
    locationId: 'hsr-layout',
    source: 'Google'
  },
  {
    id: '6',
    author: 'Arjun L.',
    rating: 5,
    text: 'The HSR location feels like an escape from the city. Lush plants, natural light, and the most comforting brunch menu.',
    date: '1 month ago',
    locationId: 'hsr-layout',
    source: 'Zomato'
  },
  {
    id: '7',
    author: 'Meera W.',
    rating: 5,
    text: 'Brought my parents here and they were blown away. Premium quality without pretension. The hospitality is genuine.',
    date: '3 weeks ago',
    locationId: 'indiranagar',
    source: 'Google'
  },
  {
    id: '8',
    author: 'Karthik B.',
    rating: 5,
    text: 'The attention to detail is remarkable. From the ceramic cups to the plating, everything feels curated yet effortless.',
    date: '2 weeks ago',
    locationId: 'koramangala',
    source: 'Google'
  }
]

export const galleryImages = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    alt: 'Coffee preparation',
    locationId: 'indiranagar'
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&q=80',
    alt: 'Cafe interior',
    locationId: 'indiranagar'
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80',
    alt: 'Brunch spread',
    locationId: 'koramangala'
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80',
    alt: 'Coffee art',
    locationId: 'koramangala'
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
    alt: 'Cozy seating',
    locationId: 'hsr-layout'
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80',
    alt: 'Morning light',
    locationId: 'hsr-layout'
  }
]

export function formatPrice(price: number): string {
  return `₹${price}`
}

export function getLocationById(id: string): Location | undefined {
  return locations.find(l => l.id === id)
}

export function getReviewsByLocation(locationId: string): Review[] {
  return reviews.filter(r => r.locationId === locationId)
}

export function getGalleryByLocation(locationId: string) {
  return galleryImages.filter(g => g.locationId === locationId)
}

export function isOpenNow(location: Location): boolean {
  const now = new Date()
  const day = now.getDay()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const currentTime = hours * 60 + minutes
  
  const isWeekend = day === 0 || day === 6
  const hoursStr = isWeekend ? location.hours.weekend : location.hours.weekday
  
  // Parse hours like "8:00 AM - 10:00 PM"
  const [openStr, closeStr] = hoursStr.split(' - ')
  
  const parseTime = (str: string) => {
    const [time, period] = str.split(' ')
    const [h, m] = time.split(':').map(Number)
    let hours = h
    if (period === 'PM' && h !== 12) hours += 12
    if (period === 'AM' && h === 12) hours = 0
    return hours * 60 + m
  }
  
  const openTime = parseTime(openStr)
  const closeTime = parseTime(closeStr)
  
  return currentTime >= openTime && currentTime < closeTime
}
