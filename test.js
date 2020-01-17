(function () {
  document.getElementById("playSound").addEventListener('click', evt => {
    playRandomSound().then(function (lastSoundUrl) {
      var lastSoundUrlDiv = document.getElementById('lastSoundUrl');
      if (lastSoundUrlDiv)
        lastSoundUrlDiv.innerText = lastSoundUrl;
    });
  });
})();
