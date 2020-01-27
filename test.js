(function () {
  document.getElementById("playSound").addEventListener('click', evt => {
    Audio.playRandomSound(2, false).then(function (lastSoundUrl) {
      var lastSoundUrlDiv = document.getElementById('lastSoundUrl');
      if (lastSoundUrlDiv)
        lastSoundUrlDiv.innerText = lastSoundUrl;
    });
  });
})();
