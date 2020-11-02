;(function (global) {
  var audio_dir = 'audio';
  var serious_sub_dir = 'serious';
  var playful_sub_dir = 'playful';

  const getFilesInDir = (dir) => Files.getEntriesAsObjectFromPackageDirectory(dir);

  function readID3Tag(file) {
    return new Promise(resolve => {
      file.slice(-128).text().then(text => {
        var out = { title: undefined, artist: undefined, album: undefined };
        if (text.substring(0, 3) == "TAG") {
          out.title  = text.substring(3,  30 + 3);
          out.artist = text.substring(33, 33 + 30);
          out.album  = text.substring(63, 63 + 30);
        }
        resolve(out);
      });
    });
  }

  function getID3TagsForFiles(filesObj) {
    return Promise.all(
      Object.entries(filesObj)
        .map(([name, file]) => readID3Tag(file).then(tag => filesObj[name].tag = tag))
    ).then(() => filesObj);
  }

  function getFilesWithDetails(dir) {
    console.log("getFilesWithDetails", dir);
    return getFilesInDir(dir)
      .then(x => { console.log(`Files in dir ${dir}`, x); return x })
      .then(getID3TagsForFiles)
      .then(filesObj => Object.entries(filesObj).map(([name, file]) => { return { 
        extensionRelativeFileName: file.relative, 
        description: file.tag.title,
        url: chrome.runtime.getURL(file.relative),
        type: 'embedded'
    } }));
  }

  async function getCustomFilesWithDetails() {
    var localDir = await navigator.storage.getDirectory();
    var filesObj = await Files.iterateEntriesAndDir(localDir)
      .then(([dir, entries]) => Files.makeObjFromEntries(entries))
      .then(getID3TagsForFiles)
      .then(filesObj => Object.entries(filesObj).map(([name, file]) => { return { 
        extensionRelativeFileName: file.relative, 
        description: file.tag.title,
        url: URL.createObjectURL(file),
        type: 'custom'
      } }));
  ;
    console.log(filesObj);
    return filesObj;
  }

  const getSeriousAudioFiles = () => getFilesWithDetails(audio_dir + '/' + serious_sub_dir);
  const getPlayfulAudioFiles = () => getFilesWithDetails(audio_dir + '/' + playful_sub_dir);
  const getCustomAudioFiles  = () => getCustomFilesWithDetails();

  function getAllAudioFiles() {
    return Promise.all([getPlayfulAudioFiles(), getSeriousAudioFiles(), getCustomAudioFiles()]);
  } 

  var audioFilesPromise;

  const refreshFileList = () => { return audioFilesPromise = getAllAudioFiles() };

  refreshFileList();

  chrome.runtime.onMessage.addListener((message, sender, callback) => {
    console.log("Received message", message);
    if (message.command == 'getPlayfulAudioFiles') {
      audioFilesPromise.then(([playful, serious]) => callback(playful))
      return true;
    } else if (message.command == 'getSeriousAudioFiles') {
      audioFilesPromise.then(([playful, serious]) => callback(serious))
      return true;
    } else if (message.command == 'getCustomAudioFiles') {
      audioFilesPromise.then(([playful, serious, custom]) => callback(custom))
      return true;
    } else if (message.command == 'getAllAudioFiles') {
      audioFilesPromise.then(([playful, serious, custom]) => callback([...playful, ...serious, ...custom]));
      return true;
    } else if (message.command == 'refreshAudioFilesList') {
      refreshFileList().then(callback);
      return true;
    } else if (message.command == 'deleteCustomAudioFile') {
      navigator.storage.getDirectory().then(dir => dir.removeEntry(message.name)).then(refreshFileList).then(callback);
      return true;
    }
  });

  global.getSeriousAudioFiles = getSeriousAudioFiles;
  global.getPlayfulAudioFiles = getPlayfulAudioFiles;
  global.getCustomAudioFiles  = getCustomAudioFiles;
})(window);
