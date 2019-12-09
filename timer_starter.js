(function () { 
    var defaultTimerLen = 10;

    // Set default value in text box based on last used timer length
    chrome.storage.local.get(['lastTimerLen'], result => {
        document.getElementById("timerMins").value = result.lastTimerLen || defaultTimerLen;
    });

    function getTimerLen() {
        var timerMinsElement = document.getElementById("timerMins");
        return timerMinsElement ? parseInt(timerMinsElement.value) : defaultTimerLen;
    }

    function startTimer() {
        var timerLen = getTimerLen();
        chrome.tabs.executeScript({code:"window.startTimerMinutes = " + timerLen + ";"});
        chrome.tabs.executeScript({file:"timer.js"});
        chrome.storage.local.set({lastTimerLen: timerLen}, function () { window.close() });
    }

    document.getElementById("startTimer").addEventListener("click", evt => {
        startTimer();
    });

    document.getElementById("timerMins").addEventListener("keyup", evt => {
        if (evt.keyCode == 13)
            startTimer();
    });
})();
