;var Audio = (function (Audio) {
  var beepUrl = chrome.runtime.getURL("audio/beep.mp3");

  const getAllSounds = () => new Promise(resolve => chrome.runtime.sendMessage({command: 'getAllAudioFiles'}, resolve));
  const getPlayfulSounds = () => new Promise(resolve => chrome.runtime.sendMessage({command: 'getPlayfulAudioFiles'}, resolve));
  const getSeriousSounds = () => new Promise(resolve => chrome.runtime.sendMessage({command: 'getSeriousAudioFiles'}, resolve));
  const getCustomSounds  = () => new Promise(resolve => chrome.runtime.sendMessage({command: 'getCustomAudioFiles'},  resolve));

  var seriousSoundsPromise = getSeriousSounds();
  var allSoundsPromise = getAllSounds();

  Audio.getAllSounds = getAllSounds; 
  Audio.getPlayfulSounds = getPlayfulSounds; 
  Audio.getSeriousSounds = getSeriousSounds; 
  Audio.getCustomSounds  = getCustomSounds; 

  Audio.pickRandomSound = function (includePlayful) {
    return (includePlayful ? allSoundsPromise : seriousSoundsPromise)
            .then(sounds => sounds[Math.floor(Math.random()*sounds.length)]);
  }

  Audio.playRandomSound = function (minPlayForSecs, includePlayful, volumePcnt) {
    return Audio.pickRandomSound(includePlayful).then(function (sound) { 
      Audio.playSound(sound.url, minPlayForSecs, volumePcnt);
      return sound.url;
    });
  }

  Audio.playBeep = (volumePcnt) => Audio.playSound(beepUrl, undefined, volumePcnt);

  console.log("Loading audio content");

  Audio.playSound = function (soundUrl, minPlayForSecs, volumePcnt, autoPlay = true, normalizeVolume = true) {
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
      if (playedFor >= minPlayForSecs)
        return;
      sound.play();
    });

    if (autoPlay)
      setTimeout(() => { console.log("Playing"); sound.play() }, 0);

    return sound;
  }

  console.log("Audio content loaded");
  return Audio;
})(Audio || {});
