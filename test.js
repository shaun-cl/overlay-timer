(function () {
  document.getElementById("playSound").addEventListener('click', evt => {
    var volumePcnt = document.getElementById("playVolume") && parseInt(document.getElementById("playVolume").value);
    Audio.playRandomSound(2, false, volumePcnt).then(function (lastSoundUrl) {
      var lastSoundUrlDiv = document.getElementById('lastSoundUrl');
      if (lastSoundUrlDiv)
        lastSoundUrlDiv.innerText = lastSoundUrl;
    });
  });
})();
