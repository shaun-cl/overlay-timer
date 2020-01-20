(function (global) {
  var audio_dir = 'audio';
  var serious_sub_dir = 'serious';
  var playful_sub_dir = 'playful';

  function getPackageDirectory() {
    return new Promise(resolve => chrome.runtime.getPackageDirectoryEntry(resolve));
  }

  function getDirectoryEntry(dir, name) {
    return new Promise(resolve => dir.getDirectory(name, {}, resolve));
  }

  function getEntries(dir) {
    return new Promise(function(resolve, reject) {
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
  }

  function getAudioFiles() {
      return getPackageDirectory().then(dir => getDirectoryEntry(dir, audio_dir + '/' + serious_sub_dir))
                                  .then(getEntries)
                                  .then(e => e.map(f => audio_dir + '/' + serious_sub_dir + '/' + f.name));
  }

  var audioFilesPromise = getAudioFiles();

  chrome.runtime.onMessage.addListener((message, sender, callback) => {
    console.log("Received message", message);
    if (message.command == 'getAudioFiles') {
      audioFilesPromise.then(files => callback(files))
      return true;
    }
  });
})(window);
