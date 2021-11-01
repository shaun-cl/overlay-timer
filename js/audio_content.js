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

  Audio.playRandomSound = function (minPlayForSecs, maxPlayForSecs, includePlayful, volumePcnt) {
    return Audio.pickRandomSound(includePlayful).then(function (sound) { 
      Audio.playSound(sound.url, minPlayForSecs, maxPlayForSecs, volumePcnt);
      return sound.url;
    });
  }

  Audio.playBeep = (volumePcnt) => Audio.playSound(beepUrl, undefined, volumePcnt);

  console.log("Loading audio content");

  Audio.playSound = function (soundUrl, minPlayForSecs, maxPlayForSecs, volumePcnt, autoPlay = true, normalizeVolume = true) {
    chrome.runtime.sendMessage({command: 'playSound', args: [soundUrl, minPlayForSecs, maxPlayForSecs, volumePcnt, autoPlay, normalizeVolume]});
  }

  console.log("Audio content loaded");
  return Audio;
})(Audio || {});
