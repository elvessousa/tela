const { app, BrowserWindow, Menu } = require('electron');
const { createMenu } = require('./menu');
const path = require('path');

app.allowRendererProcessReuse = true;

// ----------------------------------------------------
// Install/Remove: creates/removes shortcuts (Windows)
// ----------------------------------------------------
if (require('electron-squirrel-startup')) {
  app.quit();
}

// ----------------------------------------------------
// Main app window
// ----------------------------------------------------
const createWindow = () => {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 365,
    icon: `${__dirname}/assets/icons/tela.png`,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Loads UI
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Menu
  const menu = Menu.buildFromTemplate(createMenu(mainWindow));
  Menu.setApplicationMenu(menu);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

// ----------------------------------------------------
// Quit when all windows are closed
// ----------------------------------------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ----------------------------------------------------
// Recreate windows when none is on screen (macOS)
// ----------------------------------------------------
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
