//API URL -where your server lives
const API_URL = 'http://127.0.0.1:8000';

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