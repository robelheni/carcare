//API URL -where your server lives
const API_URL = 'http://127.0.0.1:8000';


//figure out which page we are on
const currentPage = window.location.pathname;

//registration page - index.html
if (currentPage==='/'){
    //get the form to handle a submission without refreshing the whole page
    const registerForm = document.getElementById('registerForm');
    const messageEl = document.getElementById('message');
    

    //handle the submission

    registerForm.addEventListener('submit', async(e) => {

        //prevent the page from refreshing
        e.preventDefault();

        //get form values
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        //create a JSON data
        const userData = {
            username: username,
            email: email,
            password: password
        };

        //send a post request to the backend
        try{
            const response = await fetch(`${API_URL}/auth/register`,{
                method: 'POST', //telling we're sending
                headers: { 'Content-Type':'application/json'}, // we are sendoing a json file
                body: JSON.stringify(userData) //converting the input values to JSON files
            });

            //convert the response json to js object
            const data =  await response.json();

            if(response.ok){
                messageEl.textContent = '✓'+ data.message;
                messageEl.className = 'Success';
                //clear form
                registerForm.reset();

                //cpod redirect to login here
                //window.location.href ='login.html';
            }else{
                messageEl.textContent = 'X'+ data.detail;
                messageEl.className = 'error';
            }
        }catch(error){
            // Network error
            messageEl.textContent = '✗ Network error. Is the server running?';
            messageEl.className = 'error';
            console.error('Error:', error);
        }



    }) 

}



//login page - login.html

if(currentPage === "/login"){
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    

    loginForm.addEventListener('submit', async(e) =>{
        e.preventDefault();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;


        const loginData = {
            username: username,
            password: password
        };

        try{
            const response = await fetch(`${API_URL}/auth/login`,{
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if(response.ok){
                //success! store token and username
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('username', data.username);

                loginMessage.textContent = '✓ Login successful! Redirecting...';
                loginMessage.className = 'success';

                //redirects to dashbaord after 1 sec
                setTimeout(() =>{
                    window.location.href = '/dashboard';
                }, 1000);
            } else{
                loginMessage.textContent = '✗ ' + data.detail;
                loginMessage.className = 'error';
            }

        }catch(error){
            loginMessage.textContent = '✗ Network error';
            loginMessage.className = 'error';
            console.error('Error:', error);
        }
    })




}

if(currentPage === "/dashboard"){

    //check if user is logged in
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    

    if (!token || !username){
        window.location.href = '/login';
    }else{
        document.getElementById('username').textContent = username;

        loadVehicles();
        loadDashboardStats();

    }

    //handle logout button
    document.getElementById('logoutBtn').addEventListener('click',()=>{
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';

    });

    //handle add vehicle form 
    const addVehicleForm = document.getElementById('addVehicleForm');
    const addVehicleMessage = document.getElementById('addVehicleMessage');

    addVehicleForm.addEventListener('submit', async(e)=>{
        e.preventDefault();

        //getting for values
        const name = document.getElementById('vehicle-name').value;
        const registration = document.getElementById('vehicle-registration').value || null;
        const mileage = parseInt(document.getElementById('vehicle-mileage').value);
        const year = document.getElementById('vehicle-year').value ? parseInt(document.getElementById('vehicle-year').value) : null;
        const fuelType = document.getElementById('vehicle-fuel-type').value || null;

        const vehicleData = {
            name: name,
            registration: registration,
            mileage: mileage,
            year: year,
            fuel_type: fuelType

        };

        try {
            const response = await fetch(`${API_URL}/vehicles`,{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(vehicleData)
            });

            const data =await response.json();

            if(response.ok){
                addVehicleMessage.textContent = '✓' +data.message;
                addVehicleMessage.className = 'success';
                addVehicleForm.reset();


                //reload vehicles to show a new one
                loadVehicles();
            }else{
                addVehicleMessage.textContent = 'x' +data.detail;
                addVehicleMessage.className = 'error';
                
            }
        } catch (error){
            addVehicleMessage.textContent = 'x network error';
            addVehicleMessage.className=  'error';
            console.error('Error:', error);
        }

    });
}

// Function to load vehicles
async function loadVehicles() {
    const token = localStorage.getItem('token'); 
    const vehiclesList = document.getElementById('vehiclesList');
    
    try {
        const response = await fetch(`${API_URL}/vehicles`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const vehicles = data.vehicles;
            
            if (vehicles.length === 0) {
                vehiclesList.innerHTML = '<p class="empty-state">No vehicles yet. Add your first vehicle above!</p>';
                return;
            }
            
            // Display vehicles with DELETE button
            vehiclesList.innerHTML = vehicles.map(vehicle => `
                <div class="vehicle-card" onclick="window.location.href='/vehicle/${vehicle.id}'">
                    <h3>${vehicle.name}</h3>
                    <div class="vehicle-info">
                        ${vehicle.registration ? `<p><strong>Registration:</strong> ${vehicle.registration}</p>` : ''}
                        <p><strong>Mileage:</strong> ${vehicle.mileage.toLocaleString()} miles</p>
                        ${vehicle.year ? `<p><strong>Year:</strong> ${vehicle.year}</p>` : ''}
                        ${vehicle.fuel_type ? `<p><strong>Fuel Type:</strong> ${vehicle.fuel_type}</p>` : ''}
                    </div>
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteVehicle(${vehicle.id}, '${vehicle.name}')">
                        Delete Vehicle
                    </button>
                </div>
            `).join('');
        } else {
            vehiclesList.innerHTML = '<p class="error">Failed to load vehicles</p>';
        }
    } catch (error) {
        vehiclesList.innerHTML = '<p class="error">Network error</p>';
        console.error('Error:', error);
    }
}

// Function to delete vehicle
window.deleteVehicle = async function(vehicleId, vehicleName) {
    const token = localStorage.getItem('token'); 
    // Confirm before deleting
    if (!confirm(`Are you sure you want to delete "${vehicleName}"? This cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success message briefly
            const tempMessage = document.createElement('div');
            tempMessage.textContent = '✓ ' + data.message;
            tempMessage.className = 'success';
            tempMessage.style.position = 'fixed';
            tempMessage.style.top = '20px';
            tempMessage.style.right = '20px';
            tempMessage.style.padding = '15px 25px';
            tempMessage.style.borderRadius = '8px';
            tempMessage.style.zIndex = '1000';
            document.body.appendChild(tempMessage);
            
            setTimeout(() => {
                tempMessage.remove();
            }, 3000);
            
            // Reload vehicles list
            loadVehicles();
        } else {
            alert('Error: ' + data.detail);
        }
    } catch (error) {
        alert('Network error');
        console.error('Error:', error);
    }
}

//function to load dashboard statistics
async function loadDashboardStats(){
    const token = localStorage.getItem('token'); 
    try{
        //fecth stats from API
        const response = await fetch(`${API_URL}/dashboard/stats`,{
            headers: {'Authorization': `Bearer ${token}`}
        });

        const data  = await response.json();

        if(response.ok){
            document.getElementById('totalVehicles').textContent = data.total_vehicles;
            document.getElementById('totalLogs').textContent = data.total_logs;
            document.getElementById('totalSpent').textContent = `£${data.total_spent.toFixed(2)}`;


            //update recent activity
            const recentActivity = document.getElementById('recentActivity');

            if(data.recent_activity.length === 0 ){
                recentActivity.innerHTML = '<p class="empty-state">No recent activity</p>';

            }else {
                recentActivity.innerHTML = data.recent_activity.map(activity => `
                    <div class="activity-item">
                        <div class="activity-info">
                            <div class="activity-type">${formatLogType(activity.log_type)}</div>
                            <div class="activity-vehicle">${activity.vehicle_name}</div>
                        </div>
                        <div>
                            <div class="activity-date">${formatActivityDate(activity.date)}</div>
                            ${activity.cost ? `<div class="activity-cost">£${activity.cost.toFixed(2)}</div>` : ''}
                        </div>
                    </div>
                `).join('');
            }


        }
    }catch(error){
        console.error('Error loading stats:' , error);
    }

    


}


//helper frunction to format an activity date
function formatActivityDate(dateString){
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor (diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

}

//helper function to format log type (reuse from vehicle page)
function formatLogType(type){
    let readable = type.replace(/_/g, ' ');
    readable = readable.replace(/\b\w/g, letter => letter.toUpperCase());
    return readable;
}

//VEHICLE DETSAIL PAGE

if(currentPage.startsWith('/vehicle/')){

    //check if logged in
    const token = localStorage.getItem('token');
    if(!token){
        window.location.href = '/login';
    }

    //get vehicle ID frorm URL
    const vehicleId = currentPage.split('/')[2];

    //logout buttton
    document.getElementById('logoutBtn').addEventListener('click', () =>{
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
    });

    // Load the vehicle details when page loads
    

    //function to load vehicle details
    async function loadVehicleDetails(){

        //let's fetch all vehicle from API 
        const response = await fetch (`${API_URL}/vehicles`, {
            headers:{ 'Authorization': `Bearer ${token}`}
        });

        //let's convert it to js object 
        const data = await response.json();


        //find  the specific vehicle we want
        const vehicle = data.vehicles.find(v => v.id == vehicleId);

        if (vehicle) {

            //store vehicle data globally
            currentVehicle = vehicle;
            // Update the page title
            document.getElementById('vehicleName').textContent = vehicle.name;
            
            // Build the details HTML
            let detailsHTML = '';
            
            if (vehicle.registration) {
                detailsHTML += `<p><strong>Registration:</strong> ${vehicle.registration}</p>`;
            }
            
            detailsHTML += `<p><strong>Current Mileage:</strong> ${vehicle.mileage.toLocaleString()} miles</p>`;
            
            if (vehicle.year) {
                detailsHTML += `<p><strong>Year:</strong> ${vehicle.year}</p>`;
            }
            
            if (vehicle.fuel_type) {
                detailsHTML += `<p><strong>Fuel Type:</strong> ${vehicle.fuel_type}</p>`;
            }

            document.getElementById('vehicleDetails').innerHTML = detailsHTML;
    }

}
loadVehicleDetails();

//store vehicle data globally so we can access it
let currentVehicle = null;

//get edit button and form elements
const editVehicleBtn = document.getElementById('editVehicleBtn');
const vehicleDisplay = document.getElementById('vehicleDisplay');
const vehicleEdit = document.getElementById('vehicleEdit');
const cancelEditBtn = document.getElementById('cancelEditBtn');

//when "edit vehicle button is clicked"

editVehicleBtn.addEventListener('click', ()=>{
    // Hide dispaly, show form
    vehicleDisplay.style.display = 'none';
    vehicleEdit.style.display ='block';
    editVehicleBtn.style.display = 'none';

    //pre form with current values
    if(currentVehicle){
        document.getElementById('edit-name').value = currentVehicle.name;
        document.getElementById('edit-registration').value = currentVehicle.registration || '';
        document.getElementById('edit-mileage').value = currentVehicle.mileage;
        document.getElementById('edit-year').value = currentVehicle.year || '';
        document.getElementById('edit-fuel-type').value = currentVehicle.fuel_type || '';
    }
});

//when cancel button is clicked 
cancelEditBtn.addEventListener('click', ()=>{
    //show display, hide form
    vehicleDisplay.style.display = 'block';
    vehicleEdit.style.display = 'none';
    editVehicleBtn.style.display = 'block';
});

//Handle editt form submission
const editVehicleForm = document.getElementById('editVehicleForm');
const editVehicleMessage = document.getElementById('editVehicleMessage');

editVehicleForm.addEventListener('submit' , async (e) => {
    //prevent page refresh
    e.preventDefault();

    //get updated values from form
    const name = document.getElementById('edit-name').value;
    const registration = document.getElementById('edit-registration').value || null;
    const mileage = parseInt(document.getElementById('edit-mileage').value);
    const year = document.getElementById('edit-year').value ? parseInt(document.getElementById('edit-year').value) : null;
    const fuelType = document.getElementById('edit-fuel-type').value || null;

    //build data object
    const updatedData = {
        name:name,
        registration: registration,
        mileage: mileage,
        year: year,
        fuel_type: fuelType
    };

    //send PUT  request to backend
    try{
        const response = await fetch(`${API_URL}/vehicles/${vehicleId}` , {
            method: 'PUT',
            headers : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },

            body: JSON.stringify(updatedData)

        });

        const data = await response.json();

        //check if it worked

        if(response.ok){
            //succes
            editVehicleMessage.textContent = '✓ ' + data.message;
            editVehicleMessage.className = 'success';

            // Wait a moment, then switch back to display mode
            setTimeout(() => {
                // Hide form, show display
                vehicleEdit.style.display = 'none';
                vehicleDisplay.style.display = 'block';
                editVehicleBtn.style.display = 'block';
                
                // Clear message
                editVehicleMessage.textContent = '';
                
                // Reload vehicle details to show updated info
                loadVehicleDetails();
                
            }, 1500);

        }else {
            // Error from backend
            editVehicleMessage.textContent = '✗ ' + data.detail;
            editVehicleMessage.className = 'error';
        }
    }catch (error) {
        // Network error
        editVehicleMessage.textContent = '✗ Network error';
        editVehicleMessage.className = 'error';
        console.error('Error:', error);
    }


});


//functiion to load all the service logs for the vehicle
    async function loadLogs(){

        //get the div where we'll display the logs
        const logsList = document.getElementById('logsList');

        //show loading message while fetchiing
        logsList.innerHTML = '<p class ="loading"> Loading logs...</p>';

        //fetch logs from the API for this Vehicle
        const response = await fetch (`${API_URL}/vehicles/${vehicleId}/logs`,{
            headers:{'Authorization':`Bearer ${token}`}
        });

        const data = await response.json();

        //check if request was succesful

        if(response.ok){
            const logs = data.logs;

            //if not logs yet,
            if (logs.length === 0) {
                logsList.innerHTML = '<p class="empty-state">No service logs yet. Add your first one above!</p>';
                return;  // Stop here
            }

            // Build HTML for each log
            let logsHTML = '';
        
        for (let log of logs) {
            logsHTML += `
                <div class="log-card" id="log-${log.id}">
                    <!-- Display Mode -->
                    <div class="log-display" id="log-display-${log.id}">
                        <div class="log-header">
                            <h3>${formatLogType(log.log_type)}</h3>
                            <span class="log-date">${formatDate(log.date)}</span>
                        </div>
                        <div class="log-details">
                            <p><strong>Mileage:</strong> ${log.mileage.toLocaleString()} miles</p>
                            ${log.cost ? `<p><strong>Cost:</strong> £${log.cost.toFixed(2)}</p>` : ''}
                            ${log.notes ? `<p><strong>Notes:</strong> ${log.notes}</p>` : ''}
                        </div>
                        <div class="log-actions">
                            <button class="btn-edit-log" onclick="editLog(${log.id})">Edit</button>
                            <button class="btn-delete-small" onclick="deleteLog(${log.id})">Delete</button>
                        </div>
                    </div>
                    
                    <!-- Edit Mode (hidden) -->
                    <div class="log-edit" id="log-edit-${log.id}" style="display: none;">
                        <form onsubmit="saveLog(event, ${log.id})">
                            <div class="form-group">
                                <label>Service Type</label>
                                <select id="edit-log-type-${log.id}" required>
                                    <option value="oil_change" ${log.log_type === 'oil_change' ? 'selected' : ''}>Oil Change</option>
                                    <option value="brake_service" ${log.log_type === 'brake_service' ? 'selected' : ''}>Brake Service</option>
                                    <option value="mot" ${log.log_type === 'mot' ? 'selected' : ''}>MOT</option>
                                    <option value="tire_rotation" ${log.log_type === 'tire_rotation' ? 'selected' : ''}>Tire Rotation</option>
                                    <option value="general_service" ${log.log_type === 'general_service' ? 'selected' : ''}>General Service</option>
                                    <option value="repair" ${log.log_type === 'repair' ? 'selected' : ''}>Repair</option>
                                    <option value="other" ${log.log_type === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Date</label>
                                    <input type="date" id="edit-log-date-${log.id}" value="${log.date}" required>
                                </div>
                                <div class="form-group">
                                    <label>Mileage</label>
                                    <input type="number" id="edit-log-mileage-${log.id}" value="${log.mileage}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Cost</label>
                                    <input type="number" id="edit-log-cost-${log.id}" value="${log.cost || ''}" step="0.01">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Notes</label>
                                <textarea id="edit-log-notes-${log.id}" rows="2">${log.notes || ''}</textarea>
                            </div>
                            <div class="form-buttons">
                                <button type="submit" class="btn-primary">Save</button>
                                <button type="button" class="btn-secondary" onclick="cancelEditLog(${log.id})">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        }
        
        logsList.innerHTML = logsHTML;
    } else {
        logsList.innerHTML = '<p class="error">Failed to load logs</p>';
    }
}
    //helper functiion :Convert log_type to readabel text
     // Example: "oil_change" becomes "Oil Change"

    function formatLogType(type){
        //replace underscores to spaces
        let readable = type.replace(/_/g, ' ');

        //capitaliza fiirst letter
        readable = readable.replace (/\b\w/g, letter => letter.toUpperCase());

        return readable;
    }


    function formatDate(dateString){
        const date = new Date(dateString);

        return date.toLocaleDateString('en-GB',{
            day:'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    loadLogs();
    loadReminders();

    //get reminder from elements
    const showAddReminderBtn = document.getElementById('showAddReminderBtn');
    const addReminderForm = document.getElementById('addReminderForm');
    const cancelReminderBtn = document.getElementById('cancelReminderBtn');


    //Show reminder form when button clicked
    showAddReminderBtn.addEventListener('click', () =>{
        addReminderForm.style.display ='block';
        showAddReminderBtn.style.display = 'none';
    });

    //Hide reminder form when button clicked
    cancelReminderBtn.addEventListener('click', ()=>{
        addReminderForm.style.display = 'none';
        showAddReminderBtn.style.display = 'block';
        document.getElementById('reminderForm').reset();
    })
    
    // Get the form and message elements
    const addLogForm = document.getElementById('addLogForm');
    const addLogMessage = document.getElementById('addLogMessage');
    
    // When form is submitted
    addLogForm.addEventListener('submit', async (e) => {
        
        // Prevent page refresh
        e.preventDefault();
        
        // Get all the form values
        const logType = document.getElementById('log-type').value;
        const logDate = document.getElementById('log-date').value;
        const logMileage = document.getElementById('log-mileage').value;
        const logCost = document.getElementById('log-cost').value;
        const logNotes = document.getElementById('log-notes').value;
        
        // Build the data object to send to API
        const logData = {
            log_type: logType,
            date: logDate,
            mileage: parseInt(logMileage)  // Convert to number
        };
        
        // Only include cost if user entered one
        if (logCost) {
            logData.cost = parseFloat(logCost);  // Convert to decimal number
        }
        
        // Only include notes if user entered any
        if (logNotes) {
            logData.notes = logNotes;
        }
        
        // Send to API
        try {
            const response = await fetch(`${API_URL}/vehicles/${vehicleId}/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(logData)
            });
            
            const data = await response.json();
            
            // Check if it worked
            if (response.ok) {
                // Success! Show message
                addLogMessage.textContent = '✓ ' + data.message;
                addLogMessage.className = 'success';
                
                // Clear the form
                addLogForm.reset();
                
                // Reload logs to show the new one
                loadLogs();
                
            } else {
                // Something went wrong
                addLogMessage.textContent = '✗ ' + data.detail;
                addLogMessage.className = 'error';
            }
            
        } catch (error) {
            // Network error
            addLogMessage.textContent = '✗ Network error';
            addLogMessage.className = 'error';
            console.error('Error:', error);
        }
    });

    //function to delete a log
    window.deleteLog = async function(logId){

        //Ask user to confirm
        const confirmed = confirm ('delete this service log?');

        //if they clicked "cancel", stop here
        if(!confirmed){
            return;
        }

        //send delete request to API
        try{
            const response = await fetch(`${API_URL}/logs/${logId}`, {
                method : 'DELETE',
                headers:{
                    'Authorization': `Bearer ${token}`
                }
            });

            if(response.ok){
                //success, reload logs to remove deleted one
                loadLogs();

            }else{
                alert('failed to delete log');
            }
        }catch(error){
            //network error
            alert('Network error');
            console.error('Error:', error);
        }
    }



//function to show edit for a log
// Function to show edit form for a log
    window.editLog = function(logId) {
        // Hide display, show edit form
        document.getElementById(`log-display-${logId}`).style.display = 'none';
        document.getElementById(`log-edit-${logId}`).style.display = 'block';
    }

    // Function to cancel editing
    window.cancelEditLog = function(logId) {
        // Show display, hide edit form
        document.getElementById(`log-display-${logId}`).style.display = 'block';
        document.getElementById(`log-edit-${logId}`).style.display = 'none';
    }

    // Function to save edited log
    window.saveLog = async function(event, logId) {
        event.preventDefault();
        
        // Get updated values
        const logType = document.getElementById(`edit-log-type-${logId}`).value;
        const logDate = document.getElementById(`edit-log-date-${logId}`).value;
        const logMileage = parseInt(document.getElementById(`edit-log-mileage-${logId}`).value);
        const logCost = document.getElementById(`edit-log-cost-${logId}`).value;
        const logNotes = document.getElementById(`edit-log-notes-${logId}`).value;
        
        const updatedData = {
            log_type: logType,
            date: logDate,
            mileage: logMileage,
            cost: logCost ? parseFloat(logCost) : null,
            notes: logNotes || null
        };
        
        try {
            const response = await fetch(`${API_URL}/logs/${logId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });
            
            if (response.ok) {
                // Reload logs to show updated version
                loadLogs();
            } else {
                alert('Failed to update log');
            }
        } catch (error) {
            alert('Network error');
            console.error('Error:', error);
        }
    }


    //funcion to load reminders
    async function loadReminders(){
        const remindersList = document.getElementById('remindersList');

        //show loading message
        remindersList.innerHTML = '<p class = "loading"> Loading reminders...</p>'
    


    try{
        //fetching reminders from API
        const response = await fetch(`${API_URL}/vehicles/${vehicleId}/reminders`,{
            headers:{'Authorization': `Bearer ${token}`}
        });

        const data = await response.json();

        if(response.ok){
            const reminders = data.reminders;

            //if no reminders
            if(reminders.length ===0){
                remindersList.innerHTML ='<p class ="empty-state">No reminders set. Click "Add Reminder" above to create one!</p>'
                return;
            }

            //building HTML for each reminder
            let remindersHTML = '';

            for(let reminder of reminders){
                const status = getReminderStatus(reminder, currentVehicle);

                remindersHTML += `
                    <div class="reminder-card ${reminder.is_completed ? 'completed' : ''} ${status.class}">
                        <div class="reminder-header">
                            <h3>${formatLogType(reminder.reminder_type)}</h3>
                            <span class="reminder-status ${status.badgeClass}">${status.text}</span>
                        </div>
                        <div class="reminder-details">
                            ${reminder.due_date ? `<p><strong>Due Date:</strong> ${formatDate(reminder.due_date)}</p>` : ''}
                            ${reminder.due_mileage ? `<p><strong>Due Mileage:</strong> ${reminder.due_mileage.toLocaleString()} miles</p>` : ''}
                            ${reminder.notes ? `<p><strong>Notes:</strong> ${reminder.notes}</p>` : ''}
                        </div>
                        <div class="reminder-actions">
                            <button class="btn-complete" onclick="completeReminder(${reminder.id})" ${reminder.is_completed ? 'disabled' : ''}>
                                ${reminder.is_completed ? '✓ Completed' : 'Mark Complete'}
                            </button>
                            <button class="btn-delete-small" onclick="deleteReminder(${reminder.id})">Delete</button>
                        </div>
                    </div>
                `;
            }
            remindersList.innerHTML  = remindersHTML;
        }else {
            remindersList.innerHTML = '<p class="error">Failed to load reminders</p>';
        }

    }catch (error){
        remindersList.innerHTML ='<p class = "error"> Network error</p>';
        console.error('Error:', error);
    }
}


    function getReminderStatus(reminder, vehicle) {
        //if already completted
        if(reminder.is_completed){
            return {
                text:'completed',
                badgeClass: 'status-completed',
                class: ''
            };
        }
    
    
        const today = new Date();
        today.setHours(0,0,0,0); //reset time to midnight for accurate comparsion

        let isOverdue = false;
        let isDueSoon = false;

        //check date-based overdue/due soon
        if(reminder.due_date){
            const dueDate = new Date(reminder.due_date);
            const daysDiff = Math.floor((dueDate - today)/(1000*60*60*24));

            if (daysDiff <0){
                isOverdue = true;
            } else if (daysDiff <=30){
                isDueSoon =true;
            }
        }


        //check mileage - based overdue/due soon
        if(reminder.due_mileage && vehicle){
            const currentMileage = vehicle.mileage;
            const mileageDiff = reminder.due_mileage - currentMileage;

            if (mileageDiff <=0){
                isOverdue = true;
            } else if(mileageDiff <= 1000){
                isDueSoon = true;
            }
        }

        //return status
        if (isOverdue){
            return {
                text:'Overdue!',
                badgeClass:'status-overdue',
                class: ''
            };
        } else {
            return {
                text: 'Upcoming',
                badgeClass: 'status-upcoming',
                class: ''
            };
        }
    }


    //Handle reminder form submission
    const reminderForm = document.getElementById('reminderForm');
    const addReminderMessage = document.getElementById('addReminderMessage');

    reminderForm.addEventListener('submit', async(e) => {
        //prevent page refresh
        e.preventDefault();

        //get form values
        const reminderType = document.getElementById('reminder-type').value;
        const reminderDate = document.getElementById('reminder-date').value || null;
        const reminderMileage = document.getElementById('reminder-mileage').value || null;
        const reminderNotes = document.getElementById('reminder-notes').value || null;

        //validation: must have at least one trigger - datte or mileage

        if(!reminderDate && !reminderMileage){
            addReminderMessage.textContent = '✗ You must set either a due date or due mileage';
            addReminderMessage.className = 'error';
            return; 
        }

        //build data object
        const reminderData = {
            reminder_type: reminderType,
            due_date: reminderDate || null,
            due_mileage: reminderMileage ? parseInt(reminderMileage) : null
        };
        
        if (reminderNotes) {
            reminderData.notes = reminderNotes;
        }

        //send to backend
        try{
            const response = await fetch (`${API_URL}/vehicles/${vehicleId}/reminders`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reminderData)
            });

            const data = await response.json();

            if (response.ok) {
                //success!
                addReminderMessage.textContent = '✓ ' + data.message;
                addReminderMessage.className = 'success';

                //reminderForm
                reminderForm.reset();

                //Hide form after short delauy
                setTimeout(() => {
                    addReminderForm.style.display = 'none';
                    showAddReminderBtn.style.display = 'block';
                    addReminderMessage.textContent = '';
                    loadReminders();
                }, 1500);
            } else {
                addReminderMessage.textContent = '✗ ' + data.detail;
                addReminderMessage.className = 'error';
            }
        } catch (error){
            addReminderMessage.textContent = 'x Network error';
            addReminderMessage.className = 'error';
            console.error('Error:', error);
        }

    });

    //function to mark reminder as completed
    window.completeReminder = async function(reminderId){
        //ask for confitmation
        const confirmed = confirm('Mark this reminder as completed');

        if(!confirmed){
            return;
        }

        try {
            const response = await fetch(`${API_URL}/reminders/${reminderId}/complete`,{
                method: 'PUT',
                headers: {
                    'Authorization' : `Bearer ${token}` 
                }
            });

            if(response.ok){
                loadReminders();
            } else {
                alert ('failed to mark reminder as complete');
            }
        } catch (error){
            alert('Network error');
            console.error('Error:', error);
        }
    }

    window.deleteReminder = async function(reminderId) {
        //ask for confirmation
        const confirmed = confirm('Delete this reminder? this cannot be undone.');

        if(!confirmed){
            return;
        }

        try {
            const response = await fetch(`${API_URL}/reminders/${reminderId}`,{
                method:'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if(response.ok){
                loadReminders();
            } else {
                alert('Failed to delete reminder');
            }
        }catch (error) {
            alert('Network error');
            console.error('Error:', error);
        }
    }




    
}


