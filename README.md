# Addis Eats

A small website for exploring the Addis Eats menu, saving favorite dishes, and putting together an order. It is built with plain HTML, CSS, and JavaScript, so there is no package installation or build step.

## What you can do

- Browse, search, and filter the dishes.
- Tap a heart to save a favorite. Favorites stay in that browser.
- Add dishes to the cart and change quantities.
- Choose a service option and fill in its order details.

## Updating the menu

Edit `menu.json` to change the dishes. Each dish has an ID, name, category, price, a couple of filter flags, and an image path. Keep IDs unique, use `true` or `false` for `spicy` and `mainDish`, and make sure each image path matches a file in `images/`.

For example:

```json
{
  "id": 9,
  "name": "A new dish",
  "category": "Vegan",
  "price": 650,
  "spicy": false,
  "mainDish": true,
  "image": "images/new-dish.jpg"
}
```

After saving, reload the page to see the update.

## Project files

- `index.html` holds the page structure.
- `styles.css` controls the look and responsive layout.
- `app.js` handles the menu, favorites, cart, and forms.
- `menu.json` contains the dish data.
- `images/` contains the local food photos.

The page also loads some fonts, icons, and the hero background from online services, so those assets need an internet connection.
