SELECT
  products.*,
  locations.id AS location_id,
  locations.location AS location_name
FROM products
LEFT JOIN locations ON products.location = locations.id
ORDER BY products.created_at DESC;
