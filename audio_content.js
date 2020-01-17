(function (global) {
  function getSounds() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({command: 'getAudioFiles'}, files => resolve(files));
    });
  }

  function pickRandomSound() {
    return soundsPromise.then(sounds => chrome.runtime.getURL(sounds[Math.floor(Math.random()*sounds.length)]));
  }

  function playRandomSound() {
    return pickRandomSound().then(function (soundUrl) { 
      playSound(soundUrl);
      return soundUrl;
    });
  }

  var soundsPromise = getSounds();

  console.log("Loading audio content");

  function oneTimeListener(event, element, handler) {
    function callHandler(e) {
      element.removeEventListener(event, callHandler); 
      return handler(e);
    }
    return element.addEventListener(event, callHandler);
  }

  function playSound(soundUrl) {
    console.log("Playing sound", soundUrl);
    var minPlayFor = 2;

    var sound      = document.createElement('audio');
    sound.id       = 'hiddenSoundPlayer';
    sound.src      = soundUrl;
    sound.type     = 'audio/mpeg';

    var oldNode = document.getElementById(sound.id);
    if (oldNode)
      oldNode.parentNode.removeChild(oldNode);
    document.body.appendChild(sound);

    oneTimeListener('canplaythrough', sound, evt => { 
      var repeatTimes = Math.ceil(Math.max(0, minPlayFor / sound.duration - 1));
      console.log('Audio loaded', evt.target, sound.duration, repeatTimes);
      sound.addEventListener('ended', evt => {
        if (repeatTimes-- <= 0) return;
        sound.play();
      });
      sound.play();
    });
  }

  console.log("Audio content loaded");
  global.pickRandomSound = pickRandomSound;
  global.playRandomSound = playRandomSound;
  global.playSound = playSound;

})(window);
