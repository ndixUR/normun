const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain

const fs = require('fs')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let config;

function createWindow () {
  // mainWindow settings
  const window_opts = {
    width: 1050, height: 600
  };

  // Use configuration values if they exist
  if (config) {
    window_opts.width = config.window_width;
    window_opts.height = config.window_height;
    window_opts.x = config.window_x;
    window_opts.y = config.window_y;
  }

  // Create the browser window.
  mainWindow = new BrowserWindow(window_opts)

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  // Give main window our configuration once the Vue framework is loaded
  mainWindow.webContents.once('vue-ready', (ev) => {
    mainWindow.send('load-config', config);
  });

  // Update configuration based on user changes in main window
  ipcMain.on('update-config', (ev, payload) => {
    config = config || {};
    config = Object.assign(payload, config);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow)
app.on('ready', configureAndCreateWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (process.platform !== 'darwin') {
    app.quit()
  //}
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('will-quit', writeConfiguration);

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// read the configuration file, make sure createWindow always happens
function configureAndCreateWindow() {
  const config_file = app.getPath('userData') + path.sep + 'config.json';
  console.log(config_file);
  if (fs.existsSync(config_file)) {
    fs.readFile(config_file, (err, data) => {
      if (err) return createWindow();
      try { config = JSON.parse(data); }
      catch (e) { console.log(e); }
      createWindow();
    });
  } else {
    createWindow();
  }
}

// before quit, write config file
function writeConfiguration() {
  if (config && !config.save_config) {
    return false;
  }

  const win_pos = mainWindow.getPosition();
  const win_size = mainWindow.getSize();

  config = config || {};
  config.window_width = win_size[0];
  config.window_height = win_size[1];
  config.window_x = win_pos[0];
  config.window_y = win_pos[1];

  fs.writeFileSync(app.getPath('userData') + path.sep + 'config.json', JSON.stringify(config));
}
