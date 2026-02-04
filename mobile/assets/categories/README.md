# Category Icons

This directory contains category icons for shopping categories.

## Generating Icons

Icons are generated using the script:
```
sandbox/generate_category_icons.py
```

Run the script to generate icons for all categories:
```bash
cd sandbox
python3 generate_category_icons.py
```

## Required Icons

The following category icons should be present:
- fruits.png
- vegetables.png
- dairy.png
- meat.png
- seafood.png
- bakery.png
- grains.png
- snacks.png
- nuts.png
- other.png

## Usage

Icons are automatically bundled with the app and loaded via `require()` statements in `CategoryPicker.tsx`. If an icon is missing, a placeholder with the first letter of the category name will be shown.
