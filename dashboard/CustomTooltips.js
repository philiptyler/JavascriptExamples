//Seperate file because the offsets are different for the image under MVC.
var shouldDisplay = false;
$(document).mousemove(AdjustToolTipPosition);

function displayTooltip(text) {
    shouldDisplay = (text != "") ? true : false;
    if (shouldDisplay) {
        $('#CustomTooltip').html(text);
        $('#CustomTooltip').show();
    }
    else {
        //Sometimes the tooltip hasn't finished fading in before we ask to hide it. This causes it to hide, then fade back in.
        $('#CustomTooltip').hide();
    }
}

function AdjustToolTipPosition(e) {
    if (shouldDisplay) {
        //TODO: I used some magic numbers here to make the tooltip position correct. Are these values derivable?
        $('#CustomTooltip').css('top', e.pageY + 20 + 'px');
        var offsetLeft = e.pageX + 15;

        var isOutsideViewport = $(this).width() - $("#CustomTooltip").width() - offsetLeft < 30; //30 visually looks correct.. not 0.

        if (isOutsideViewport) {
            offsetLeft = $(this).width() - $("#CustomTooltip").width() - 30;
        }

        $('#CustomTooltip').css('left', offsetLeft + 'px');
    }
}