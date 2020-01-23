(function (global) {
  var audio_dir = 'audio';
  var serious_sub_dir = 'serious';
  var playful_sub_dir = 'playful';

  function getAudioFiles() {
      return Files.getPackageDirectory()
                  .then(dir => Files.getDirectoryEntry(dir, audio_dir + '/' + serious_sub_dir))
                  .then(Files.getEntries)
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
