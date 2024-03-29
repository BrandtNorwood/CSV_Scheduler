/*  File Holds functions for editing the csv file.

    Niko Norwood - March 19 2024
*/
//used to store ref to employee from fileData Array
var selectedEmployee = {};



//These two functions handle the tab switcher button at the top of the page
function loadGenerator(){
    document.getElementById("editButton").style.display="";
    document.getElementById("genButton").style.display="none";
    document.getElementById("edit").style.display="none";
    document.getElementById("outputPane").style.display="";
    generateTable()
}



//called whenever a change is saved as well as when the tab is opened
function loadEditor() {
    document.getElementById("editButton").style.display="none";
    document.getElementById("genButton").style.display="";
    document.getElementById("edit").style.display="";
    document.getElementById("outputPane").style.display="none";
    clearPTOEdit();
    loadPreview();
    loadEMPSelect();
}



//Loads Preveiw pane. Most of this code is stolen from the table generator
function loadPreview(){
    var employeeSelected = document.getElementById("empSelect").selectedIndex
    if(employeeSelected < 0) {employeeSelected = 0;}

    var unfilteredGenData = parseWeek(fileData);
    var filteredGenData = filterPTO(unfilteredGenData);

    //Create table HTML object
    var table = document.createElement('table');
    table.setAttribute("id","table");

    //Use these to define feilds once instead of 500 times
    const feilds = ['Name','Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    //Creates Top lables
    let topLabels = document.createElement('tr'); 
    topLabels.style.background = "#c5c5c5"
    for (let i = 0; i < feilds.length; i++){
        let labelElement = document.createElement('th');
        if (feilds[i] == "Name"){
            labelElement.appendChild(document.createTextNode(feilds[i]));
        } else{
            let thisDate = generateDay(i-1,new Time('0000'))
            labelElement.appendChild(document.createTextNode(
                feilds[i] + " " + (thisDate.getMonth()+1) + "/" + thisDate.getDate() + "/" + thisDate.getFullYear()
            ));
        }
        topLabels.appendChild(labelElement);
    }
    table.appendChild(topLabels);

    selectedEmployee = fileData[employeeSelected];

    let employee = filteredGenData[employeeSelected];

    let empElement = document.createElement('tr');

    feilds.forEach(feild =>{
        feildElement = document.createElement('th');

        if (employee[feild]) {
            if(employee[feild].filtered){}
            else {feildElement.style.background = pickColor(employee.Index);}

            if(employee[feild].changed){feildElement.style.textDecoration = "underline"; }

            if (feild == "Name"){
                feildElement.appendChild(document.createTextNode(employee[feild]));
            }else{
                feildElement.appendChild(document.createTextNode(outputDay(employee[feild])));
            }
        }
        empElement.appendChild(feildElement);
    });
    table.appendChild(empElement);

    //Reloads Page Elements
    loadTimeEditor();
    populatePTOSelect();

    //clear outputPane, attach table
    document.getElementById("previewPane").replaceChildren();
    document.getElementById("previewPane").appendChild(table);
}



//to load times and checkboxes
function loadTimeEditor(){  
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    //Populates name feild
    document.getElementById("nameFeild").value = selectedEmployee.Name;

    //populates time editors
    days.forEach(day => {
        //if this day is currently scheduled
        if (selectedEmployee[day]){
            //Check the box for the day and fill in the time feilds
            document.getElementById((day + "On")).checked = true;
            document.getElementById(("start" + day)).value = selectedEmployee[day].startTime.toString().slice(0, -3);
            document.getElementById(("end" + day)).value = selectedEmployee[day].endTime.toString().slice(0, -3);
            
            //makes sure the time selectors are not grayed out
            document.getElementById((day+"Times")).classList.remove("inactive");
        } else {
            //Uncheck box and set time feilds to their defaults
            document.getElementById((day + "On")).checked = false;
            document.getElementById(("start" + day)).value = "";
            document.getElementById(("end" + day)).value = "";

            //Grays out the time selectors
            document.getElementById((day+"Times")).classList.add("inactive");
        }
    });
}



//Updates highlighting on the weekly shift editor (called any time a change is made in shiftEdit)
function updateShiftHighlights(){
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    days.forEach(day =>{
        if(document.getElementById((day+"On")).checked){
            document.getElementById((day+"Times")).classList.remove("inactive");
        } else {
            document.getElementById((day+"Times")).classList.add("inactive");
        }
    });
}



//Takes times from the edit panel and populates the fileData Array
function saveShiftChanges(){
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let nameFeild = document.getElementById("nameFeild").value;

    //Handles renaming employees 
    if (nameFeild != selectedEmployee.Name){
        if(confirm(`Change name from ${selectedEmployee.Name} to ${nameFeild}?`)){
            selectedEmployee.Name = nameFeild;
        }
    }

    days.forEach(day =>{
        if(document.getElementById((day+"On")).checked){
            let startTimeSelected = convertFeildToTime(document.getElementById(("start" + day)).value);
            let endTimeSelected = convertFeildToTime(document.getElementById(("end" + day)).value);

            selectedEmployee[day] = {startTime:startTimeSelected, endTime:endTimeSelected}
        } else {
            selectedEmployee[day] = null;
        }
    });

    //Maybe swap this for loading the whole page?
    loadPreview();
    loadEMPSelect();
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
            selector.options[selector.options.length] = new Option(request.start.toLocaleString('en-US') + " - " + request.end.toLocaleString('en-US'));
        })
    }
}



//Fills in the date and time feilds from the selected PTO element
function populatePTOEdit(){
    let selectedPTO = selectedEmployee.PTO[document.getElementById("PTOSelect").selectedIndex];

    //messy but the selectors are very perticular about input
    document.getElementById("ptoStartDate").value = 
            selectedPTO.start.getFullYear() + "-" + (selectedPTO.start.getMonth() + 1).toString().padStart(2, '0') + "-" + selectedPTO.start.getDate().toString().padStart(2, '0');
    document.getElementById("ptoStartTime").value = 
            selectedPTO.start.getHours().toString().padStart(2, '0') + ":" + selectedPTO.start.getMinutes().toString().padStart(2, '0');
    document.getElementById("ptoEndDate").value = 
            selectedPTO.end.getFullYear() + "-" + (selectedPTO.end.getMonth() + 1).toString().padStart(2, '0') + "-" + selectedPTO.end.getDate().toString().padStart(2, '0');
    document.getElementById("ptoEndTime").value = 
            selectedPTO.end.getHours().toString().padStart(2, '0') + ":" + selectedPTO.end.getMinutes().toString().padStart(2, '0');
}



//Prompts user and removes the PTO element thats selected
function deletePTO(){
    let selectedPTO = document.getElementById("PTOSelect").selectedIndex;

    if(selectedPTO >= 0){
        if(confirm("Delete Selected PTO Request?")){
            selectedEmployee.PTO.splice(selectedPTO,1);

            loadEditor();
        }
    }
}



//Takes in inputs and pushes them to the selected PTO element
function savePTOChange(){
    //get all the input feilds
    let selectedPTO = document.getElementById("PTOSelect").selectedIndex;
    let newStartTime = document.getElementById("ptoStartTime").value;
    let newStartDate = document.getElementById("ptoStartDate").value
    let newEndTime = document.getElementById("ptoEndTime").value;
    let newEndDate = document.getElementById("ptoEndDate").value;

    //parse them into Date Objects
    let newStart = convertFeildsToDate(newStartDate,newStartTime);
    let newEnd = convertFeildsToDate(newEndDate, newEndTime);

    if (newStart <= newEnd){
        //assign the Date objects to selected PTO
        selectedEmployee.PTO[selectedPTO].start = newStart;
        selectedEmployee.PTO[selectedPTO].end = newEnd;

        loadEditor();//reload to show result
    } else {
        alert("Start must be after End!")
    }
}



//Clears out the PTO request editor feilds
function clearPTOEdit(){
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

    selectedEmployee.PTO.push({start: "", end: ""});
}



//loads the employee selection menu
function loadEMPSelect(){
    var empSelect = document.getElementById("empSelect");

    //Clears list
    for(i = (empSelect.options.length - 1); i >= 0; i--) {
        empSelect.remove(i);
    }

    //Populates list
    for (var i=0; i < fileData.length; i++){
        empSelect.options[empSelect.options.length] = new Option(fileData[i].Name);
    }
}
