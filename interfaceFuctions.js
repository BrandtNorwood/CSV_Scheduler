/*  Functions that are directly tied to UI but not editing or generator related

    Niko Norwood - 2/29/2024
*/

//Populates the week display feild
function loadWeekDisplay(){
    var weekDisplay = document.getElementById("weekDisplay");
    let endDate = new Date(genDate);
    endDate.setDate(endDate.getDate() + 7);

    weekDisplay.replaceChildren();
    weekDisplay.appendChild(document.createTextNode(
        (genDate.getMonth()+1) + "/" + genDate.getDate() + "/" + genDate.getFullYear() + " - " +
        (endDate.getMonth()+1) + "/" + (endDate.getDate()) + "/" + endDate.getFullYear()
    ));
}



//used to set the generator date one week ahead or behind
function timeSkipButton(forward){
    genDate.setDate(genDate.getDate() + (forward ? 7:-7));
    loadWeekDisplay();
    generateTable();
    loadPreview();
}



//returns a date set to the next sunday
function AutoTimeSkip(thisDate){
    thisDate.setDate(thisDate.getDate() + (7-thisDate.getDay())); 
    thisDate.setHours(0);
    thisDate.setMinutes(0);
    thisDate.setSeconds(0);

    return thisDate;
}



//Parses a shift object into readable text
function outputDay(shiftObject){
    let start = shiftObject.startTime;
    let end = shiftObject.endTime;

    return (
        start.getHours() + ":" + 
        start.getMinutes().toString().padStart(2, '0') + " - " + 
        end.getHours() + ":" + 
        end.getMinutes().toString().padStart(2, '0')
    );
}