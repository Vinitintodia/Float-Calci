# Float Calci - Chrome Extension Installation Guide

## 📦 What's Included

Float Calci is now available as a Chrome extension! Access your calculators from any webpage with a single click.

## 🚀 Installation Steps

### Method 1: Load Unpacked Extension (Development)

1. **Build the Extension** (if not already built):
   ```bash
   npm run build
   ```

2. **Open Chrome Extensions Page**:
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or click the three dots menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**:
   - Click "Load unpacked" button
   - Navigate to your project folder
   - Select the `dist` folder
   - Click "Select Folder"

5. **Done!** 
   - The Float Calci icon should appear in your extensions toolbar
   - Click the icon to open the calculator popup

### Method 2: Package as ZIP (For Distribution)

1. **Create a ZIP file**:
   - Navigate to the `dist` folder
   - Select all files and folders
   - Right-click → Send to → Compressed (zipped) folder
   - Name it `float-calci-extension.zip`

2. **Share or Install**:
   - Share the ZIP file with others
   - They can extract and follow Method 1 to install

## 🎯 How to Use

1. **Click the Extension Icon**: 
   - Find the Float Calci icon in your Chrome toolbar
   - Click it to open the calculator popup

2. **Choose Calculator Type**:
   - **Basic**: Standard arithmetic operations
   - **Scientific**: Trigonometric, logarithmic, and advanced functions
   - **Financial**: Compound interest calculations

3. **Use Keyboard Shortcuts**:
   - All keyboard shortcuts work in the popup
   - Numbers, operators, and function keys

## 📁 Extension Structure

```
dist/
├── manifest.json          # Extension configuration
├── popup.html            # Popup interface
├── index.html            # Full web app (optional)
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── assets/               # Built JavaScript and CSS
    ├── popup.js
    ├── index.js
    └── *.css
```

## 🔧 Features

- ✅ **Popup Calculator**: Quick access from toolbar
- ✅ **Three Calculator Types**: Basic, Scientific, Financial
- ✅ **Keyboard Support**: Full keyboard shortcuts
- ✅ **macOS-Style Controls**: Red, yellow, green window buttons
- ✅ **Offline Access**: Works without internet
- ✅ **Lightweight**: Fast and efficient

## 🐛 Troubleshooting

### Extension Not Loading
- Make sure you selected the `dist` folder, not the project root
- Check that `manifest.json` exists in the dist folder
- Verify Developer mode is enabled

### Calculator Not Displaying
- Check browser console for errors (F12)
- Try reloading the extension
- Rebuild with `npm run build`

### Icons Not Showing
- Ensure icons folder is copied to dist
- Check icon paths in manifest.json
- Reload the extension

## 📝 Development

To make changes:

1. Edit source files in `src/`
2. Run `npm run build`
3. Copy manifest and icons to dist:
   ```bash
   copy public\manifest.json dist\manifest.json
   xcopy public\icons dist\icons\ /E /I /Y
   ```
4. Click "Reload" button in Chrome extensions page

## 🌐 Publishing to Chrome Web Store (Optional)

To publish your extension:

1. Create a developer account at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 registration fee
3. Prepare store listing:
   - Screenshots
   - Promotional images
   - Description
4. Upload the ZIP file
5. Submit for review

## 📄 Permissions

The extension requests minimal permissions:
- **storage**: Save calculator preferences (future feature)

No sensitive data is collected or transmitted.

## 🎨 Customization

You can customize:
- Calculator colors in source files
- Window control button styles
- Popup dimensions in `popup.tsx`
- Extension name/description in `manifest.json`

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**License**: MIT
