# Font Setup Guide

This guide explains how to download and bundle the required fonts locally for Manifest V3 compliance.

## Required Fonts

### 1. Inter (Modern Pro Theme)
- **Weights**: 300, 400, 500, 600, 700
- **Format**: WOFF2
- **URL**: https://fonts.google.com/specimen/Inter

### 2. Lato (Zen Mode Theme - Body)
- **Weights**: 300, 400, 700
- **Format**: WOFF2
- **URL**: https://fonts.google.com/specimen/Lato

### 3. Merriweather (Zen Mode Theme - Headings)
- **Weights**: 300, 400, 700
- **Styles**: Regular + Italic
- **Format**: WOFF2
- **URL**: https://fonts.google.com/specimen/Merriweather

### 4. JetBrains Mono (Cyber Focus Theme)
- **Weights**: 300, 400, 700
- **Format**: WOFF2
- **URL**: https://fonts.google.com/specimen/JetBrains+Mono

---

## Method 1: Google Fonts Helper (Recommended)

1. Visit: https://gwfh.mranftl.com/fonts
2. For each font:
   - Search for the font name
   - Select the required weights
   - Choose "Modern Browsers" (woff2 only)
   - Download the zip file
3. Extract the `.woff2` files
4. Place them in `/public/assets/fonts/` with this structure:

```
public/assets/fonts/
├── inter-300.woff2
├── inter-400.woff2
├── inter-500.woff2
├── inter-600.woff2
├── inter-700.woff2
├── lato-300.woff2
├── lato-400.woff2
├── lato-700.woff2
├── merriweather-300.woff2
├── merriweather-300italic.woff2
├── merriweather-400.woff2
├── merriweather-400italic.woff2
├── merriweather-700.woff2
├── merriweather-700italic.woff2
├── jetbrains-mono-300.woff2
├── jetbrains-mono-400.woff2
└── jetbrains-mono-700.woff2
```

---

## Method 2: Direct Download from Google Fonts

```bash
# From project root
cd public/assets/fonts

# Download Inter
curl -o inter-300.woff2 "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjg.woff2"
curl -o inter-400.woff2 "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZ9hjg.woff2"
curl -o inter-500.woff2 "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZ9hjg.woff2"
curl -o inter-600.woff2 "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZ9hjg.woff2"
curl -o inter-700.woff2 "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZ9hjg.woff2"

# Download Lato
curl -o lato-300.woff2 "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh7USSwaPGR_p.woff2"
curl -o lato-400.woff2 "https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjxAwXjeu.woff2"
curl -o lato-700.woff2 "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwaPGR_p.woff2"

# Download Merriweather
curl -o merriweather-300.woff2 "https://fonts.gstatic.com/s/merriweather/v30/u-4n0qyriQwlOrhSvowK_l521wRpX837pvjxPA.woff2"
curl -o merriweather-400.woff2 "https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5OeyxNV-bnrw.woff2"
curl -o merriweather-700.woff2 "https://fonts.gstatic.com/s/merriweather/v30/u-4n0qyriQwlOrhSvowK_l52xwNpX837pvjxPA.woff2"
curl -o merriweather-300italic.woff2 "https://fonts.gstatic.com/s/merriweather/v30/u-4l0qyriQwlOrhSvowK_l5-eR7lXcf_hP3hPGWH.woff2"
curl -o merriweather-400italic.woff2 "https://fonts.gstatic.com/s/merriweather/v30/u-4m0qyriQwlOrhSvowK_l5-eSZJdeP3r-Ho.woff2"
curl -o merriweather-700italic.woff2 "https://fonts.gstatic.com/s/merriweather/v30/u-4l0qyriQwlOrhSvowK_l5-eR71Wsf_hP3hPGWH.woff2"

# Download JetBrains Mono
curl -o jetbrains-mono-300.woff2 "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbr2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOVkA.woff2"
curl -o jetbrains-mono-400.woff2 "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yK1jPVmUsaKr.woff2"
curl -o jetbrains-mono-700.woff2 "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbr2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKy5P1OVkA.woff2"
```

---

## Method 3: NPM Package (Alternative)

```bash
npm install @fontsource/inter @fontsource/lato @fontsource/merriweather @fontsource/jetbrains-mono --save-dev

# Then copy the woff2 files manually to public/assets/fonts/
```

---

## Verification

After downloading fonts, verify the setup:

1. Check that all files exist:
```bash
ls -la public/assets/fonts/*.woff2
```

2. Build the project:
```bash
npm run build
```

3. Verify fonts are in dist:
```bash
ls -la dist/assets/fonts/
```

---

## Troubleshooting

### Fonts not loading
- Check browser DevTools Console for 404 errors
- Verify `manifest.json` includes fonts in `web_accessible_resources`
- Ensure file names match exactly in `fonts.css`

### CORS errors
- Fonts should be loaded locally, not from CDN
- Check that files are in the correct directory

### Build errors
- Verify all font files are `.woff2` format
- Check that vite.config.ts includes assets in the build

---

## Current Status

✅ Font architecture set up (src/styles/fonts.css)
✅ Fallback fonts configured (system fonts used until local fonts added)
⏸️ **Local font files need to be downloaded** (follow instructions above)
✅ Manifest updated to allow font access

**Next step**: Follow Method 1 or Method 2 above to download fonts.
