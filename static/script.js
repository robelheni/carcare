//API URL -where your server lives
const API_URL = 'http://127.0.0.1:8000';
const token = localStorage.getItem('token');

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
    vehicleDisplay.style.Display = 'block';
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
                    <div class="log-card">
                        <div class="log-header">
                            <h3>${formatLogType(log.log_type)}</h3>
                            <span class="log-date">${formatDate(log.date)}</span>
                        </div>
                        <div class="log-details">
                            <p><strong>Mileage:</strong> ${log.mileage.toLocaleString()} miles</p>
                `;
                
                // Only show cost if it exists
                if (log.cost) {
                    logsHTML += `<p><strong>Cost:</strong> £${log.cost.toFixed(2)}</p>`;
                }
                
                // Only show notes if they exist
                if (log.notes) {
                    logsHTML += `<p><strong>Notes:</strong> ${log.notes}</p>`;
                }
                
                logsHTML += `
                        </div>
                        <button class="btn-delete-small" onclick="deleteLog(${log.id})">Delete</button>
                    </div>
                `;
            }
            
            // Put all the logs on the page
            logsList.innerHTML = logsHTML;
            
        } else {
            // If something went wrong
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
}


