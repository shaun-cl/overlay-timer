(function () {
    // The geese mp3 is in the public domain, http://soundbible.com/952-Canadian-Geese.html
    var geeseUrl = chrome.runtime.getURL("geese.mp3");

    function playSound(soundUrl) {
        var newNode = document.createElement("div");
        newNode.id = 'hiddenSoundPlayer';
        newNode.innerHTML = '<div id="player"> <audio autoplay hidden> <source src="' + soundUrl + '" type="audio/mpeg"> </audio> </div>';
        var oldNode = document.getElementById(newNode.id);
        if (oldNode)
            oldNode.parentNode.removeChild(oldNode);
        document.body.appendChild(newNode);
    }

    function makeClockOverlayDiv(appendTo) {
        var node = document.createElement("div");
        appendTo = appendTo || document.body;
        node.className = 'overlayTimer';
        node.style.position = 'fixed';
        node.style.top = '10px'; 
        node.style.right = '400px'; 
        node.style.borderStyle = 'solid';
        node.style.borderWidth = '2px';
        node.style.borderColor = 'black';
        node.style.backgroundColor = 'white';
        node.style.padding = '10px';
        node.innerHTML = '<div style="display: inline-block"><span class="hours"></span></div> : ' + 
                         '<div style="display: inline-block"><span class="minutes"></span></div> : ' + 
                         '<div style="display: inline-block"><span class="seconds"></span></div>';

        // Technically higher than the max signed positive integer but seems to work somehow
        node.style.zIndex = '2147483647';

        // Remove old nodes attached to this parent 
        deleteChildClocks(appendTo);

        //document.body.insertBefore(node, document.body.firstChild);
        appendTo.appendChild(node);
        return node;
    }

    function deleteChildClocks(parentNode) {
        Array.from(parentNode.children).filter(n => n.classList.contains("overlayTimer")).forEach(n => n.parentNode.removeChild(n));
    }

    // Clock code from https://www.sitepoint.com/build-javascript-countdown-timer-no-dependencies/
    function getTimeRemaining(endtime) {
        var t = Date.parse(endtime) - Date.parse(new Date());
        var seconds = Math.floor((t / 1000) % 60);
        var minutes = Math.floor((t / 1000 / 60) % 60);
        var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        return {
            'total': t,
            'days': days,
            'hours': hours,
            'minutes': minutes,
            'seconds': seconds
        };
    }

    function initializeClock(node, endtime) {
        var clock = node;
        var daysSpan = clock.querySelector('.days');
        var hoursSpan = clock.querySelector('.hours');
        var minutesSpan = clock.querySelector('.minutes');
        var secondsSpan = clock.querySelector('.seconds');

        var lastRemaining;

        function updateClock() {
            var t = getTimeRemaining(endtime);

            if (daysSpan) daysSpan.innerHTML = t.days;
            hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

            if (t.total <= 0 && lastRemaining.total >= 0) {
                playSound(geeseUrl);
                //clearInterval(timeinterval);
            }
            lastRemaining = t;
        }

        updateClock();
        var timeinterval = setInterval(updateClock, 1000);
    }

    var clock = makeClockOverlayDiv();
    var timerLengthMinutes = window.startTimerMinutes || 15;
    var deadline = new Date(Date.parse(new Date()) + timerLengthMinutes * 60 * 1000);
    initializeClock(clock, deadline);

    var oldFullScreenElement = null;

    document.addEventListener("fullscreenchange", function (event) {
        if (document.fullscreenElement) {
            console.log("Gone full screen", document.fullscreenElement);
            var newClock = makeClockOverlayDiv(document.fullscreenElement);
            initializeClock(newClock, deadline);
            oldFullScreenElement = document.fullscreenElement;
        } else {
            console.log("Left full screen", document.fullscreenElement);
            if (oldFullScreenElement)
                deleteChildClocks(oldFullScreenElement);
        }
    });
})();

