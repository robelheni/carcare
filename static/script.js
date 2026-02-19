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