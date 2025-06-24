const mappedProducts = data.map((p: any) => ({
  ...p,
  quantity: p.stock_quantity,
  min_quantity: p.min_quantity,
  // Make sure to use toLowerCase() and the correct property from your locations table
  locationName: p.locations?.Location
    ? p.locations.Location.toLowerCase()
    : '',
}));

const restaurantProducts = mappedProducts.filter(p => p.locationName === 'restaurant');
const bakeryProducts = mappedProducts.filter(p => p.locationName === 'bakery');
const lowStock = mappedProducts.filter(p => p.quantity <= p.min_quantity);