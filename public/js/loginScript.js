document.querySelector("#btnRegister").addEventListener("click", toggleForm);
document.querySelector("#btnCreateAccountCancel").addEventListener("click", toggleForm);
document.querySelector("#registerForm").addEventListener("submit", validateCreateAccount);

function toggleForm() {
    if (document.querySelector("#registerForm").hidden) {
        document.querySelector("#registerForm").hidden = false;
        document.querySelector("#loginForm").hidden = true;
    } else {
        document.querySelector("#registerForm").hidden = true;
        document.querySelector("#loginForm").hidden = false;
    }

    document.querySelector("#loginError").innerHTML = "";
}

async function validateCreateAccount(e) {
    e.preventDefault();

    let username = document.querySelector("#regUsername").value;
    let password = document.querySelector("#regPass").value;
    let passConfirm = document.querySelector("#regPassConf").value;

    // confirm password
    if (password != passConfirm) {
        console.log("Passwords do not match");
        document.querySelector("#loginError").innerHTML = "Passwords do not match";
        return;
    }

    // check username availability
    let response = await fetch(`/api/check-username?username=${username}`);
    let data = await response.json();
    console.log(data);

    if (data) {
        console.log("Username is taken");
        document.querySelector("#loginError").innerHTML = "Username already taken";
        return;
    }

    e.target.submit();
}