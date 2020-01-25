; var Audio = (function (Audio) {
  var beepUrl = chrome.runtime.getURL("audio/serious/beep.mp3");

  function oneTimeListener(event, element, handler) {
    function callHandler(e) {
      element.removeEventListener(event, callHandler); 
      return handler(e);
    }
    return element.addEventListener(event, callHandler);
  }

  function getSounds() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({command: 'getAudioFiles'}, files => resolve(files));
    });
  }

  Audio.pickRandomSound = function () {
    return soundsPromise.then(sounds => chrome.runtime.getURL(sounds[Math.floor(Math.random()*sounds.length)]));
  }

  Audio.playRandomSound = function (minPlayFor) {
    return Audio.pickRandomSound().then(function (soundUrl) { 
      Audio.playSound(soundUrl, minPlayFor);
      return soundUrl;
    });
  }

  Audio.playBeep = function () {
    Audio.playSound(beepUrl);
  }

  var soundsPromise = getSounds();

  console.log("Loading audio content");

  Audio.playSound = function (soundUrl, minPlayFor) {
    console.log("Playing sound", soundUrl);
    minPlayFor = minPlayFor || 0;

    var sound      = document.createElement('audio');
    sound.id       = 'hiddenSoundPlayer';
    sound.src      = soundUrl;
    sound.type     = 'audio/mpeg';

    oneTimeListener('canplaythrough', sound, evt => { 
      var repeatTimes = Math.ceil(Math.max(0, minPlayFor / sound.duration - 1));
      console.log('Audio loaded', evt.target, sound.duration, repeatTimes, minPlayFor);
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
