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

  var playingAudio = null;

  const playSound = function (soundUrl, minPlayForSecs, maxPlayForSecs, volumePcnt, autoPlay = true, normalizeVolume = true) {
    console.log("Playing sound", soundUrl);
    minPlayForSecs = minPlayForSecs || 0;
    volumePcnt = volumePcnt == undefined ? 1.0 : volumePcnt / 100.0;

    var sound      = document.createElement('audio');
    sound.id       = 'hiddenSoundPlayer';
    sound.src      = soundUrl;
    sound.type     = 'audio/mpeg';
    sound.volume   = volumePcnt;
    // sound.controls = true;

    var oldNode = document.getElementById(sound.id);
    if (oldNode)
      oldNode.parentNode.removeChild(oldNode);
    document.body.appendChild(sound);

    if (normalizeVolume) {
      // Normalize the volume of the mp3, from https://github.com/est31/js-audio-normalizer
      var audioElem = sound;
      var audioCtx = window.audioCtx || new AudioContext();
      var src = audioCtx.createMediaElementSource(audioElem);
      var gainNode = audioCtx.createGain();
      gainNode.gain.value = 1.0;

      audioElem.addEventListener("play", function (evt) {
        console.log("Normalize", evt);
        src.connect(gainNode);
        gainNode.connect(audioCtx.destination);
      }, true);

      audioElem.addEventListener("pause", function (evt) {
        // disconnect the nodes on pause, otherwise all nodes always run
        src.disconnect(gainNode);
        gainNode.disconnect(audioCtx.destination);
      }, true);

      fetch(soundUrl)
        .then(function(res) { return res.arrayBuffer(); })
        .then(function(buf) {
          return audioCtx.decodeAudioData(buf);
        }).then(function(decodedData) {
          var decodedBuffer = decodedData.getChannelData(0);
          var sliceLen = Math.floor(decodedData.sampleRate * 0.05);
          var averages = [];
          var sum = 0.0;
          for (var i = 0; i < decodedBuffer.length; i++) {
            sum += decodedBuffer[i] ** 2;
            if (i % sliceLen === 0) {
              sum = Math.sqrt(sum / sliceLen);
              averages.push(sum);
              sum = 0;
            }
          }
          // Ascending sort of the averages array
          averages.sort(function(a, b) { return a - b; });
          // Take the average at the 95th percentile
          var a = averages[Math.floor(averages.length * 0.95)];

          var gain = 1.0 / a;
          // Perform some clamping
          // gain = Math.max(gain, 0.02);
          // gain = Math.min(gain, 100.0);

          // ReplayGain uses pink noise for this one one but we just take
          // some arbitrary value... we're no standard
          // Important is only that we don't output on levels
          // too different from other websites
          gain = gain / 10.0;
          console.log("Gain determined", name, a, gain);
          gainNode.gain.value = gain;
        });
    }

    var playedFor = 0;
    sound.addEventListener('ended', evt => {
      playedFor += evt.target.currentTime;
      console.log('Sound ended', evt, playedFor);
      if (playedFor >= minPlayForSecs) {
        playingAudio = null;
        return;
      }
      sound.play();
    });

    if (maxPlayForSecs)
      sound.addEventListener('play', evt => {
        playingAudio = sound;
        setTimeout(() => sound.pause(), maxPlayForSecs * 1000);
      });

    if (autoPlay)
      setTimeout(() => { 
        console.log("Playing"); 
        sound.play() 
        playingAudio = sound;
      }, 0);

    return sound;
  }

  const stopSound = () => { if (playingAudio) try { playingAudio.pause(); } catch (err) { console.log("Stopping error", err); } };

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
    } else if (message.command == 'playSound') {
      playSound(...message.args);
    } else if (message.command == 'stopSound') {
      stopSound();
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
