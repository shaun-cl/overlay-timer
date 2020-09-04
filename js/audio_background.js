;(function (global) {
  var audio_dir = 'audio';
  var serious_sub_dir = 'serious';
  var playful_sub_dir = 'playful';

  const getFilesInDir = (dir) => Files.getEntriesAsObjectFromPackageDirectory(dir);

  function readID3Tag(fileEntry) {
    return new Promise(resolve => {
      fileEntry.file(file => {
        file.slice(-128).text().then(text => {
          var out = { title: undefined, artist: undefined, album: undefined };
          if (text.substring(0, 3) == "TAG") {
            out.title = text.substring(3, 30 + 3);
            out.artist = text.substring(33, 33 + 30);
            out.album = text.substring(63, 63 + 30);
          }
          resolve(out);
        });
      })
    });
  }

  function getID3TagsForFiles(filesObj) {
    return Promise.all(Object.entries(filesObj).map(([name, fileEntry]) => readID3Tag(fileEntry).then(tag => filesObj[name].tag = tag))).then(() => filesObj);
  }

  function getFilesWithDetails(dir) {
    return getFilesInDir(dir)
      .then(getID3TagsForFiles)
      .then(filesObj => Object.entries(filesObj).map(([name, fileEntry]) => { return { name: fileEntry.relative, desc: fileEntry.tag.title } }));
  }

  const getSeriousAudioFiles = () => getFilesWithDetails(audio_dir + '/' + serious_sub_dir);
  const getPlayfulAudioFiles = () => getFilesWithDetails(audio_dir + '/' + playful_sub_dir);

  function getAllAudioFiles() {
    return Promise.all([getPlayfulAudioFiles(), getSeriousAudioFiles()]);
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
      audioFilesPromise.then(([playful, serious]) => callback([...playful, ...serious]));
      return true;
    }
  });

  global.getSeriousAudioFiles = getSeriousAudioFiles;
  global.getPlayfulAudioFiles = getPlayfulAudioFiles;
})(window);
