(function () { 
    var defaultTimerLen = 10;

    chrome.storage.local.get(['lastTimerLen'], result => {
        document.getElementById("timerMins").value = result.lastTimerLen || defaultTimerLen;
    });

    function getTimerLen() {
        var timerMinsElement = document.getElementById("timerMins");
        return timerMinsElement ? parseInt(timerMinsElement.value) : defaultTimerLen;
    }

    document.getElementById("startTimer").addEventListener("click", evt => {
        var timerLen = getTimerLen();
        chrome.tabs.executeScript({code:"window.startTimerMinutes = " + timerLen + ";"});
        chrome.tabs.executeScript({file:"timer.js"});
        chrome.storage.local.set({lastTimerLen: timerLen}, function () { window.close() });
    });
})();
