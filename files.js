;var Files = (function (Files) {
  Files.getPackageDirectory = function () {
    return new Promise(resolve => chrome.runtime.getPackageDirectoryEntry(resolve));
  };

  Files.getDirectoryEntry = function (dir, name) {
    return new Promise(resolve => dir.getDirectory(name, {}, resolve));
  };

  Files.getEntries = function (dir) {
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

  return Files
})(Files || {});
