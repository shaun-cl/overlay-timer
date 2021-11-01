(function () {
  var getVolumePcnt = () => document.getElementById("playVolume") && parseInt(document.getElementById("playVolume").value);
  var setLastSound = (url) => (document.getElementById('lastSoundUrl') || {}).innerText = url;

  document.getElementById("playSound").addEventListener('click', evt => {
    Audio.playRandomSound(2, true, getVolumePcnt()).then(lastSoundUrl => setLastSound(lastSoundUrl));
  });

  var allSoundsDiv = document.getElementById("listAllSounds");
  Audio.getAllSounds().then(sounds => sounds.forEach(sound => {
    var newDiv = document.createElement("div");
    newDiv.innerHTML = `Sound: ${sound.name}, Description: ${sound.desc} <button class='original'>Play</button><button class='normalized'>Play Normalized</button>`;
    newDiv.querySelector("button.original").addEventListener("click", () => Audio.playSound(chrome.runtime.getURL(sound.name), undefined, undefined, true, false));
    newDiv.querySelector("button.normalized").addEventListener("click", () => Audio.playSound(chrome.runtime.getURL(sound.name), undefined, undefined, true, true));
    allSoundsDiv.appendChild(newDiv);
  }));

  if (startTimer) 
    startTimer(20);
})();
