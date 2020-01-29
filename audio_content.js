; var Audio = (function (Audio) {
  var beepUrl = chrome.runtime.getURL("audio/beep.mp3");

  function oneTimeListener(event, element, handler) {
    function callHandler(e) {
      element.removeEventListener(event, callHandler); 
      return handler(e);
    }
    return element.addEventListener(event, callHandler);
  }

  function getAllSounds() {
    return new Promise(resolve => chrome.runtime.sendMessage({command: 'getAllAudioFiles'}, resolve));
  }

  function getSeriousSounds() {
    return new Promise(resolve => chrome.runtime.sendMessage({command: 'getSeriousAudioFiles'}, resolve));
  }

  Audio.pickRandomSound = function (includePlayful) {
    return (includePlayful ? allSoundsPromise : seriousSoundsPromise)
            .then(sounds => chrome.runtime.getURL(sounds[Math.floor(Math.random()*sounds.length)]));
  }

  Audio.playRandomSound = function (minPlayForSecs, includePlayful, volumePcnt) {
    return Audio.pickRandomSound(includePlayful).then(function (soundUrl) { 
      Audio.playSound(soundUrl, minPlayForSecs, volumePcnt);
      return soundUrl;
    });
  }

  Audio.playBeep = function (volumePcnt) {
    Audio.playSound(beepUrl, undefined, volumePcnt);
  }

  var seriousSoundsPromise = getSeriousSounds();
  var allSoundsPromise = getAllSounds();

  console.log("Loading audio content");

  Audio.playSound = function (soundUrl, minPlayForSecs, volumePcnt) {
    console.log("Playing sound", soundUrl);
    minPlayForSecs = minPlayForSecs || 0;
    volumePcnt = volumePcnt == undefined ? 1.0 : volumePcnt / 100.0;


    var sound      = document.createElement('audio');
    sound.id       = 'hiddenSoundPlayer';
    sound.src      = soundUrl;
    sound.type     = 'audio/mpeg';
    sound.volume   = volumePcnt;

    oneTimeListener('canplaythrough', sound, evt => { 
      var repeatTimes = Math.ceil(Math.max(0, minPlayForSecs / sound.duration - 1));
      console.log('Audio loaded', evt.target, sound.duration, repeatTimes, minPlayForSecs);
      sound.addEventListener('ended', evt => {
        console.log('Sound ended');
        if (repeatTimes-- <= 0) return;
        sound.play();
      });
      console.log('Playing sound');
      sound.play();
    });

    var oldNode = document.getElementById(sound.id);
    if (oldNode)
      oldNode.parentNode.removeChild(oldNode);
    document.body.appendChild(sound);
  }

  console.log("Audio content loaded");
  return Audio;
})(Audio || {});
