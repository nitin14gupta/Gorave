// The website's city photos (website/public/img/areas/city-*.webp), resized
// for the app, so the app and gorave.in show the same city.
export const CITY_PHOTOS: Record<string, number> = {
  Mumbai: require('../../assets/images/cities/mumbai.webp'),
  Delhi: require('../../assets/images/cities/delhi.webp'),
  Bangalore: require('../../assets/images/cities/bangalore.webp'),
  Hyderabad: require('../../assets/images/cities/hyderabad.webp'),
  Chennai: require('../../assets/images/cities/chennai.webp'),
  Kolkata: require('../../assets/images/cities/kolkata.webp'),
  Pune: require('../../assets/images/cities/pune.webp'),
  Goa: require('../../assets/images/cities/goa.webp'),
}

/** The cities with a photo, in the order they're shown first. */
export const FEATURED_CITIES = Object.keys(CITY_PHOTOS)
