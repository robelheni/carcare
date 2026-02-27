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
                <div class="vehicle-card">
                    <h3>${vehicle.name}</h3>
                    <div class="vehicle-info">
                        ${vehicle.registration ? `<p><strong>Registration:</strong> ${vehicle.registration}</p>` : ''}
                        <p><strong>Mileage:</strong> ${vehicle.mileage.toLocaleString()} miles</p>
                        ${vehicle.year ? `<p><strong>Year:</strong> ${vehicle.year}</p>` : ''}
                        ${vehicle.fuel_type ? `<p><strong>Fuel Type:</strong> ${vehicle.fuel_type}</p>` : ''}
                    </div>
                    <button class="btn-delete" onclick="deleteVehicle(${vehicle.id}, '${vehicle.name}')">
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