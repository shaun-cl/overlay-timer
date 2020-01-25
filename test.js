(function () {
  document.getElementById("playSound").addEventListener('click', evt => {
    Audio.playRandomSound().then(function (lastSoundUrl) {
      var lastSoundUrlDiv = document.getElementById('lastSoundUrl');
      if (lastSoundUrlDiv)
        lastSoundUrlDiv.innerText = lastSoundUrl;
    });
  });
})();
