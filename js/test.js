(function () {
  var getVolumePcnt = () => document.getElementById("playVolume") && parseInt(document.getElementById("playVolume").value);
  var setLastSound = (url) => (document.getElementById('lastSoundUrl') || {}).innerText = url;

  document.getElementById("playSound").addEventListener('click', evt => {
    Audio.playRandomSound(2, true, getVolumePcnt()).then(lastSoundUrl => setLastSound(lastSoundUrl));
  });

  var allSoundsDiv = document.getElementById("listAllSounds");
  Audio.getAllSounds().then(soundUrls => soundUrls.forEach(soundUrl => {
    var newDiv = document.createElement("div");
    newDiv.innerHTML = "Sound: " + soundUrl + " <button class='original'>Play</button><button class='normalized'>Play Normalized</button>";
    newDiv.querySelector("button.original").addEventListener("click", () => Audio.playSound(chrome.runtime.getURL(soundUrl), undefined, undefined, true, false));
    newDiv.querySelector("button.normalized").addEventListener("click", () => Audio.playSound(chrome.runtime.getURL(soundUrl), undefined, undefined, true, true));
    allSoundsDiv.appendChild(newDiv);
  }));

  if (startTimer) 
    startTimer(20);
})();
