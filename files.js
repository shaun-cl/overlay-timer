;(function (global) {
  global.Files = global.Files || {};

  global.Files.getPackageDirectory = function () {
    return new Promise(resolve => chrome.runtime.getPackageDirectoryEntry(resolve));
  };

  global.Files.getDirectoryEntry = function (dir, name) {
    return new Promise(resolve => dir.getDirectory(name, {}, resolve));
  };

  global.Files.getEntries = function (dir) {
    return new Promise(resolve => {
      var dirReader = dir.createReader();
      var entries = [];

      function getAppendEntries() {
        dirReader.readEntries(results => {
          if (results.length) {
            entries = entries.concat(results.filter(f => !f.name.startsWith(".")));
            getAppendEntries();
          } else
            resolve(entries);
        });
      }

      getAppendEntries();
    });
  };
})(window);
