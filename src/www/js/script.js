var count = 0;
const { ipcRenderer } = require('electron');
const clipboardy = require('node-clipboardy');

function formatDate () {
    let today = new Date();
    return today.toISOString().split('T')[0];
}

const close = document.getElementById('close');
const minimize = document.getElementById('minimize');
const maximize = document.getElementById('maximize');

close.addEventListener('click', () => {
    ipcRenderer.send('close');
});

minimize.addEventListener('click', () => {
    ipcRenderer.send('minimize');
});

maximize.addEventListener('click', () => {
    ipcRenderer.send('maximize');
});

document.getElementsByClassName('notification-close')[0].addEventListener('click', () => {
    document.getElementsByClassName('notification-bar')[0].style.display = 'none';
});

const cards = document.getElementsByClassName('card-mode');

for (let i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', () => {
        if (cards[i].innerHTML === '-') {
            cards[i].innerHTML = '+';
            cards[i].parentElement.style.maxHeight = '0px';
        }
        else if (cards[i].innerHTML === '+') {
            cards[i].innerHTML = '-';
            cards[i].parentElement.style.maxHeight = 'unset';
        }
    });
}

document.getElementById('add-entry').addEventListener('click', addEntry);
document.getElementById('spoiler-generate').getElementsByTagName('a')[0].addEventListener('click', addEntry);
document.getElementById('remove-entry').addEventListener('click', removeEntry);

// Export Information
const Title = 'name,username,password,group';
var data = [];

function generateCSV (username, password, group) {
    data.push([`"${username}","${username}","${password}","${group}"`]);
}

function downloadFile (filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function validateDate(date) 
{
    let parts = date.split('-');
    if (parts.length != 3) return false;
    if (parts[0].length != 4) return false;
    if (parts[1].length > 2) return false;
    if (parts[2].length > 2) return false;
    return true;
}

document.getElementById('export').addEventListener('click', () => {
    const usernames = document.getElementsByClassName('username');
    if (usernames.length === 0) return showToast('error', 'No entries to export');
    for (let i = 1; i < usernames.length +1; i++) {
        let string = document.getElementById(`username-${i}`).value;
        let siteName = document.getElementsByClassName(`site-name`)[0].getElementsByTagName('input')[0].value;
        let accountNumber = document.getElementsByClassName(`account-number`)[0].getElementsByTagName('input')[0].value;
        let munisVersion = document.getElementsByClassName(`munis-version`)[0].getElementsByTagName('input')[0].value;
        let engagementType = document.getElementsByClassName(`engagement-type`)[0].getElementsByTagName('input')[0].value;
        let engagementDate = document.getElementsByClassName(`engagement-date`)[0].getElementsByTagName('input')[0].value;
        let group = `${siteName} - ${accountNumber}\\${engagementType} - Munis ${munisVersion} - ${engagementDate}\\${string.split("/")[0]}`;
        let username = string.split("/")[1];
        let usergroup = string.split("/")[0];
        let hiddenpassword = document.getElementById(`password-${i}`);
        hiddenpassword.type = "text";
        let password = hiddenpassword.value;
        hiddenpassword.type = "password";
        if (usergroup === "") return showToast('error', 'Username cannot be empty');
        if (!string.includes('/')) return showToast('error', 'Username must be in the format of "group/username"');
        if (username === "") return showToast('error', 'Username cannot be empty');
        if (password === "") return showToast('error', 'Password cannot be empty');
        if (siteName === "") return showToast('error', 'Site Name cannot be empty');
        if (accountNumber === "") return showToast('error', 'Account Number cannot be empty');
        if (munisVersion === "") return showToast('error', 'Munis Version cannot be empty');
        if (engagementType === "") return showToast('error', 'Engagement Type cannot be empty');
        if (engagementDate === "") return showToast('error', 'Engagement Date cannot be empty');

        if (typeof siteName != 'string') return showToast('error', 'Site Name could not be parsed as text');
        if (isNaN(parseInt(accountNumber))) return showToast('error', 'Account Number could not be parsed as an integer');
        if (isNaN(parseInt(munisVersion))) return showToast('error', 'Munis Version could not be parsed as an integer');
        if (typeof engagementType != 'string') return showToast('error', 'Engagement Type could not be parsed as text');
        if (validateDate(engagementDate) === false) return showToast('error', 'Engagement Date could not be parsed as a date');
        if (typeof string != 'string') return showToast('error', 'Username could not be parsed as text');
        if (typeof password != 'string') return showToast('error', 'Password could not be parsed as text');
        generateCSV(username.toLowerCase(), password, group);
    }
    data.unshift([Title]);
    var report = data.map(function(d){
        return d.join(',');
    }).join('\n').replace(/(^\[)|(\]$)/mg, '');
    downloadFile(`Devolutions-Report-${formatDate()}.csv`, report);
    return showToast('success', 'Report exported successfully');
    data = [];
});

function addEntry() {
    count++;
    let parent = document.getElementsByClassName("scroll-box-content")[1];
    let entry = document.createElement("div");
    entry.className = "entry";
    parent.appendChild(entry);
    let username = document.createElement("div");
    username.className = "username";
    let usernameText = document.createElement("p");
    usernameText.innerHTML = "Username";
    username.appendChild(usernameText);
    let usernameInput = document.createElement("input");
    usernameInput.id = `username-${count}`;
    usernameInput.type = "text";
    usernameInput.placeholder = "Group/Username";
    usernameInput.className = "username-input";
    username.appendChild(usernameInput);
    usernameInput.addEventListener('dblclick', () => {
        if (usernameInput.value === "") return;
        clipboardy.writeSync(usernameInput.value);
        showToast('success', 'Username copied to clipboard');
    });
    entry.appendChild(username);

    let password = document.createElement("div");
    password.className = "password float-right";
    let passwordText = document.createElement("p");
    passwordText.innerHTML = "Password";
    password.appendChild(passwordText);
    let passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "Password";
    passwordInput.id = `password-${count}`;
    passwordInput.className = "password-input";
    password.appendChild(passwordInput);
    passwordInput.addEventListener('dblclick', () => {
        // Copy to clipboard if not empty
        if (passwordInput.value === "") return;
        passwordInput.type = "text";
        clipboardy.writeSync(passwordInput.value);
        passwordInput.type = "password";
        showToast('success', 'Password copied to clipboard');
    });
    entry.appendChild(password);
    if (document.getElementById('spoiler-generate')) {
        document.getElementById('spoiler-generate').style.display = 'none';
    }
}

function removeEntry () {
    if (count == 0) return;
    if (count == 1) {
        document.getElementById('spoiler-generate').style.display = 'block';
    }
    let parent = document.getElementsByClassName("scroll-box-content")[1];
    parent.removeChild(parent.lastChild);
    count--;
}

const charset = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","1","2","3","4","5","6","7","8","9","0"];
document.getElementById('generate-password').addEventListener("click", generateAll);


function generate() {
    const specialCharacters = [];
    const characters = [];
    specialCharacters.push('!');
    specialCharacters.push('@');

    // Iterate based on length value
    for (let i = 0; i < 16; i++) {
        // Pick random character from charset
        let random = Math.floor(Math.random() * charset.length);
        characters.push(charset[random]);
    }

    if (specialCharacters.length > characters.length) return;
    characters.splice(0, specialCharacters.length)
    var password = shuffle(characters.concat(specialCharacters));

    // Prevent password from starting with a special character
    while (specialCharacters.includes(password[0]) || specialCharacters.includes(password[password.length -1])) {
        password = shuffle(password);
    }

    const sanitized = password.toString().replace(/,/g, '');
    return sanitized;
}

// Shuffle array
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }

function generateAll() {
    // Check password length
    const passwords = document.getElementsByClassName('password-input');
    for (let i = 1; i < passwords.length +1; i++) {
        if (document.getElementById(`password-${i}`).value == "") {
            document.getElementById(`password-${i}`).value = generate();
        }
    }
}

function showToast (mode, message) {
    if (mode === 'success') {
        // Green
        document.getElementsByClassName('notification-bar')[0].style.border = '1px solid #238636';
        document.getElementsByClassName('notification-content')[0].style.color = '#238636';
    } else if (mode === 'error') {
        // Red
        document.getElementsByClassName('notification-bar')[0].style.border = '1px solid #ed6a5e';
        document.getElementsByClassName('notification-content')[0].style.color = '#ed6a5e';
    }
    document.getElementsByClassName('notification-bar')[0].style.display = 'flex';
    document.getElementsByClassName('notification-content')[0].innerHTML = message;
    setTimeout(() => {
        if (document.getElementsByClassName('notification-bar')[0].style.display === 'flex') {
            document.getElementsByClassName('notification-bar')[0].style.display = 'none';
        }
        document.getElementsByClassName('notification-content')[0].innerHTML = '';
    }, 3000);
}