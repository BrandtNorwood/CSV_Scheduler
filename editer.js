/*  File Holds functions for editing the data

    Niko Norwood - March 19 2024
*/
//used to store ref to employee from fileData Array
var selectedEmployee = {};
var userCred = {username:"",password:""};

var timeOptions = { hour12: false }; //makes dates into 24hr

//Loads Preveiw pane. Most of this code is stolen from the table generator
function loadPreview(){
    console.log(selectEmployee());
    selectedEmployee = selectEmployee();
    loadTimeEditor();
    document.getElementById("nameFeild").value = selectedEmployee.Name;
}



//Takes the value in the empSelector and loads the apropriate emp out of the filedata
function selectEmployee(){
    empSelector = document.getElementById("empSelect");

    if (empSelector.value == fileData[empSelector.selectedIndex].Name){
        return fileData[empSelector.selectedIndex];
    } 
    //If there is a missmatch we advance the index till we find the correct emp
    else {
        let onIndex = empSelector.selectedIndex;

        //Capped at 5000 just in case
        while (empSelector.value != fileData[onIndex].Name && onIndex < 5000){
            onIndex++;
        }

        return fileData[onIndex]
    }
}



//to load times and checkboxes
function loadTimeEditor(){  
    let shiftSelector = document.getElementById("shiftSelector");

    //clear selector
    shiftSelector.length = 0;
    
    let activeShifts = selectedEmployee.Shifts;

    activeShifts.forEach(thisShift => {
        if (thisShift.endDate){
            shiftSelector.options[shiftSelector.options.length] = new Option(
                "Starts on " + thisShift.origin.toDateString() + 
                ", ends on " + thisShift.endDate.toDateString() + 
                " and repeats every " + thisShift.repeatFrequency + " days"
            );
        }else {
            shiftSelector.options[shiftSelector.options.length] = new Option(
                "Starts on " + thisShift.origin.toDateString() +
                " and repeats every " + thisShift.repeatFrequency + " days"
            );
        }
    });
}



//Takes times from the edit panel and populates the fileData Array
function saveShiftChanges(){
    //disabled for rework
}



//Chat GPT solution to turning the HTML time strings into ones I can pass to the Time constructer
function convertFeildToTime(timeString) {
    // Extract hour and minute components
    const [hour, minute] = timeString.split(/[:.]/).slice(0, 2);
    
    // Convert to integers
    const hourInt = parseInt(hour, 10);
    const minuteInt = parseInt(minute, 10);
    
    // Calculate and return the result as a string
    return new Time(hourInt.toString().padStart(2, '0') + minuteInt.toString().padStart(2, '0'));
}



//takes the raw data from PTO edit inputs and returns a Date object
function convertFeildsToDate(dateString, timeString){
    return new Date (dateString + "T" + convertFeildToTime(timeString).toString());
}




//fills in the PTO Selector dropdown
function populatePTOSelect(){
    let selector = document.getElementById("PTOSelect");

    selector.options.length = 0; //clear pto list

    if(selectedEmployee.PTO){
        //fill with requests from current user
        selectedEmployee.PTO.forEach(request =>{
            if (request.end > genDate){
                selector.options[selector.options.length] = new Option(request.start.toLocaleString('en-US',timeOptions) + " - " + request.end.toLocaleString('en-US'));
            }
        })
    }
}



//Handles deleting employees.
function deleteEmployee(){
    selectedEmployee.Shifts.forEach(shift =>{
        shift.endDate = genDate;
    });

    if(onlineMode){
        saveRemoteEmployee(selectedEmployee);
    }else{
        loadEditor();
    }
}



//Fills in the date and time feilds from the selected PTO element
function populatePTOEdit(){
    let selectedPTO = selectedEmployee.PTO[document.getElementById("PTOSelect").selectedIndex];

    if(selectedPTO.notes){document.getElementById("notesBox").value = selectedPTO.notes;}
    else {document.getElementById("notesBox").value = "";}

    console.log(selectedPTO.start.getHours() == 0 , selectedPTO.start.getMinutes() == 0 ,
        selectedPTO.end.getHours() == 23 , selectedPTO.end.getMinutes() == 59); 

    if(selectedPTO.start.getHours() == 0 && selectedPTO.start.getMinutes() == 0 &&
            selectedPTO.end.getHours() == 23 && selectedPTO.end.getMinutes() == 59){
        document.getElementById("allDayCheck").checked = true;
        ptoAllDay();
    } else {
        document.getElementById('allDayCheck').checked = false;
        ptoAllDay();

        document.getElementById("ptoStartTime").value = 
            selectedPTO.start.getHours().toString().padStart(2, '0') 
            + ":" + selectedPTO.start.getMinutes().toString().padStart(2, '0');
        document.getElementById("ptoEndTime").value = 
            selectedPTO.end.getHours().toString().padStart(2, '0') 
            + ":" + selectedPTO.end.getMinutes().toString().padStart(2, '0');
    }

    //messy but the selectors are very perticular about input
    document.getElementById("ptoStartDate").value = 
            selectedPTO.start.getFullYear() + "-" + (selectedPTO.start.getMonth() + 1).toString().padStart(2, '0') 
            + "-" + selectedPTO.start.getDate().toString().padStart(2, '0');
    document.getElementById("ptoEndDate").value = 
            selectedPTO.end.getFullYear() + "-" + (selectedPTO.end.getMonth() + 1).toString().padStart(2, '0') 
            + "-" + selectedPTO.end.getDate().toString().padStart(2, '0');
}



//Prompts user and removes the PTO element thats selected
function deletePTO(){
    let selectedPTO = document.getElementById("PTOSelect").selectedIndex;

    if(selectedPTO >= 0){
        if(confirm("Delete Selected PTO Request?")){
            selectedEmployee.PTO.splice(selectedPTO,1);

            if(onlineMode){
                saveRemoteEmployee(selectedEmployee);
            }else{
                loadEditor();
            }
        }
    }
}



//Takes in inputs and pushes them to the selected PTO element
function savePTOChange(){
    //get all the input feilds
    let notesBox = document.getElementById("notesBox").value;
    let selectedPTO = document.getElementById("PTOSelect").selectedIndex;
    let newStartTime = document.getElementById("ptoStartTime").value;
    let newStartDate = document.getElementById("ptoStartDate").value
    let newEndTime = document.getElementById("ptoEndTime").value;
    let newEndDate = document.getElementById("ptoEndDate").value;

    if(selectedPTO < 0){return;}

    //parse them into Date Objects
    var newStart = convertFeildsToDate(newStartDate,newStartTime);
    var newEnd = convertFeildsToDate(newEndDate, newEndTime);

    if (newStart <= newEnd){
        //assign the Date objects to selected PTO
        selectedEmployee.PTO[selectedPTO].start = newStart;
        selectedEmployee.PTO[selectedPTO].end = newEnd;

        //for notes 
        if (notesBox || selectedEmployee.PTO[selectedPTO].notes){
            selectedEmployee.PTO[selectedPTO].notes = notesBox;
        }

        if(onlineMode){saveRemoteEmployee(selectedEmployee);}else{
            loadEditor();//reload to show result
        }
    } else {
        alert("Start must be after End!")
    }
}



//Clears out the PTO request editor feilds
function clearPTOEdit(){
    document.getElementById("notesBox").value = "";
    document.getElementById("PTOSelect").selectedIndex = -1;
    document.getElementById("ptoStartTime").value = "";
    document.getElementById("ptoStartDate").value = "";
    document.getElementById("ptoEndTime").value = "";
    document.getElementById("ptoEndDate").value = "";
}



//Creates new PTO request
function newPTORequest(){
    let now = new Date(Date.now());
    let selector = document.getElementById("PTOSelect");
    selector.options[selector.options.length] = new Option("New Request");

    document.getElementById("PTOSelect").selectedIndex = (selector.options - 1);

    document.getElementById("ptoStartTime").value = "12:00";
    document.getElementById("ptoEndTime").value = "12:00";
    document.getElementById("ptoStartDate").value = 
            now.getFullYear() + "-" + (now.getMonth() + 1).toString().padStart(2, '0') + "-" + now.getDate().toString().padStart(2, '0');
    document.getElementById("ptoEndDate").value = 
            now.getFullYear() + "-" + (now.getMonth() + 1).toString().padStart(2, '0') + "-" + now.getDate().toString().padStart(2, '0');
    
    if(!selectedEmployee.PTO){selectedEmployee.PTO = new Array();}

    selectedEmployee.PTO.push({start: new Date(genDate), end: new Date(genDate)});
}



//loads the employee selection menu
function loadEMPSelect(){
    var empSelect = document.getElementById("empSelect");
    let currentlySelected = empSelect.selectedIndex;
    let beforeLength = empSelect.options.length;

    //Clears list
    for(i = (empSelect.options.length - 1); i >= 0; i--) {
        empSelect.remove(i);
    }

    //Populates list
    for (var i=0; i < fileData.length; i++){
        empSelect.options[empSelect.options.length] = new Option(fileData[i].Name);
    }

    if (beforeLength == empSelect.options.length){empSelect.selectedIndex = currentlySelected;}
}



//Save employee to server
function saveRemoteEmployee(saveEmployee) {
    if (onlineMode == "authOn" && userCred.username.length == 0){
        userCred.username = prompt("Enter your username:");
        userCred.password = prompt("Enter your password:");
    }

    fetch(Url + "/saveEMP",{
        method:"POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({userCred, employee:saveEmployee})
    })
    .then(response => response.json())
    .then(response => {
        if(response.authenticated){
            getRemoteData().then(function(){loadEditor();});
        } else {
            if(confirm("Username or Password was incorrect!\nTry again?")){
                userCred.username = "";
                saveRemoteEmployee(saveEmployee);
            }
        }
    });
}
 

function ptoAllDay(){
    if (document.getElementById("allDayCheck").checked){
        document.getElementById("ptoStartTime").value = "00:00:00";
        document.getElementById("ptoEndTime").value = "23:59:59";

        document.getElementById("ptoStartTime").classList.add("inactive");
        document.getElementById("ptoEndTime").classList.add("inactive");
    } else {
        document.getElementById("ptoStartTime").value = "12:00:00";
        document.getElementById("ptoEndTime").value = "12:00:00";

        document.getElementById("ptoStartTime").classList.remove("inactive");
        document.getElementById("ptoEndTime").classList.remove("inactive");
    }
}