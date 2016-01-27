var gui = require('nw.gui');
if (process.platform === "darwin") {
  var mb = new gui.Menu({type: 'menubar'});
  mb.createMacBuiltin('Wikipedia Game Browser', {
    hideEdit: false,
  });
  gui.Window.get().menu = mb;
}
