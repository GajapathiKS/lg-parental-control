# Screensaver Photos

Drop JPG, PNG, or WebP files in this folder and list them in `manifest.json`.

Example:

```json
{
  "basePath": "assets/screensaver/",
  "photos": [
    { "src": "family-beach.jpg", "alt": "Beach day" },
    { "src": "science-fair.png", "alt": "Science fair" }
  ]
}
```

The blocked screen scales portrait and landscape images automatically: a blurred cover image fills the TV while the clear foreground image is fitted inside the frame.
