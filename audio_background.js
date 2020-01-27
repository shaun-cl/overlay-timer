(function (global) {
  var audio_dir = 'audio';
  var serious_sub_dir = 'serious';
  var playful_sub_dir = 'playful';

  function getSeriousAudioFiles() {
    return Files.getFileNamesFromPackageDirectory(audio_dir + '/' + serious_sub_dir);
  } 

  function getPlayfulAudioFiles() {
    return Files.getFileNamesFromPackageDirectory(audio_dir + '/' + playful_sub_dir);
  } 

  function getAllAudioFiles() {
    return Promise.all([getPlayfulAudioFiles(), getSeriousAudioFiles()]);
  } 

  function getAudioFiles() {
    return Files.getPackageDirectory()
                .then(dir => Files.getDirectoryEntry(dir, audio_dir + '/' + serious_sub_dir))
                .then(Files.getEntries)
                .then(e => e.map(f => audio_dir + '/' + serious_sub_dir + '/' + f.name));
  }

  var audioFilesPromise = getAllAudioFiles();

  chrome.runtime.onMessage.addListener((message, sender, callback) => {
    console.log("Received message", message);
    if (message.command == 'getPlayfulAudioFiles') {
      audioFilesPromise.then(([playful, serious]) => callback(playful))
      return true;
    } else if (message.command == 'getSeriousAudioFiles') {
      audioFilesPromise.then(([playful, serious]) => callback(serious))
      return true;
    } else if (message.command == 'getAllAudioFiles') {
      audioFilesPromise.then(([playful, serious]) => callback(playful.concat(serious)))
      return true;
    }
  });
})(window);
