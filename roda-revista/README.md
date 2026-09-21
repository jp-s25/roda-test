# RODÁ — 17 Semanas Creando una Empresa · Digital Edition 2026

Visor de revista sin build ni dependencias propias (solo PDF.js desde cdnjs).

## Cómo usarlo
1. Colocá tu revista como `revista.pdf` junto a `index.html`.
2. Colocá `assets/logo.png` (pantalla final) y `assets/portada.jpg` (imagen al compartir el link).
3. Abrí el proyecto con un servidor, no con doble clic (el navegador bloquea leer el PDF desde `file://`):
   - `python3 -m http.server 8000` y abrí http://localhost:8000
   - o subilo a Netlify, Vercel o GitHub Pages.

Si abrís `index.html` directo, la web te ofrece **Elegir PDF** para cargar el archivo a mano.

## Usar imágenes en vez de PDF
En `app.js`, completá `CONFIG.pages`:
```js
pages: ['pages/page-01.jpg', 'pages/page-02.jpg', 'pages/page-03.jpg']
```

## Controles
- Desktop: ← → pasan página · `F` pantalla completa · `+` / `-` zoom · `Esc` cierra paneles. Clic en el tercio izquierdo/derecho, o arrastrar.
- Móvil: swipe, pellizco para zoom, doble toque en el centro para acercar.
- Doble clic en el centro: zoom. Con zoom, arrastrá para mover la página.

## Notas
- Al publicar, poné la URL absoluta de `portada.jpg` en `og:image` (`index.html`).
- La intro se muestra una vez por sesión; el botón "Saltar" la omite.
- iPhone no permite pantalla completa en Safari: el botón se oculta. Con "Añadir a pantalla de inicio" se abre sin barras.
- Colores: `--blue` y `--beige` al inicio de `style.css`.
