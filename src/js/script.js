const ipc = require('electron').ipcRenderer;
document.getElementById('x').onclick = function () {
    ipc.send('close');
}

document.getElementById('minimize').onclick = function () {
    ipc.send('minimize');
}

var count = 0;
const charset = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","1","2","3","4","5","6","7","8","9","0"];

const generatebtn = document.getElementById('generate');
generatebtn.addEventListener("click", generateAll);

const add = document.getElementById('add');
add.addEventListener("click", addNew);

const remove = document.getElementById('remove');
remove.addEventListener("click", removeIndex);

function formatDate () {
    let today = new Date();
    return today.toISOString().split('T')[0];
}

function generateAll() {
    // Check password length
    var length = parseInt(document.getElementById('length').value);
    if (length < 8) return alert("The minimum password length is 8 characters");
    const passwords = document.getElementsByClassName('password');
    for (let i = 1; i < passwords.length +1; i++) {
        document.getElementById(`password-${i}`).value = generate();
    }
}

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

// export to CSV
const exportbutton = document.getElementById('export');

exportbutton.addEventListener("click", function() {
    const usernames = document.getElementsByClassName('username');
    for (let i = 1; i < usernames.length +1; i++) {
        let string = document.getElementById(`username-${i}`).value;
        let siteName = document.getElementById(`site-name`).value;
        let munisVersion = document.getElementById(`munis-version`).value;
        let group = `${siteName}\\${munisVersion}\\${string.split("/")[0]}`;
        let username = string.split("/")[1];
        let password = document.getElementById(`password-${i}`).value;
        if (typeof username == 'string' && typeof password == 'string' && typeof group == 'string') {
            generateCSV(username.toLowerCase(), password, group);
        } else {
            console.error(`Error: Username, Password or Group is not a string at index ${i}`);
        }
    }
    data.unshift([Title]);
    var report = data.map(function(d){
        return d.join(',');
    }).join('\n').replace(/(^\[)|(\]$)/mg, '');
    downloadFile(`Devolutions-Report-${formatDate()}.csv`, report);
    data = [];
});

function addNew () {
    count++;
    let parent = document.getElementById("content2");
    let br = document.createElement("br");

    let username = document.createElement("input");
    username.type = "text";
    username.className = "username";
    username.id = "username-" + count;
    username.placeholder = "Group/Username";

    let show = document.createElement("button");
    show.classList = "show";
    show.id = count;
    show.innerHTML = "Show";
    

    let password = document.createElement("input");
    password.type = "password";
    password.className = "password";
    password.id = "password-" + count;
    password.placeholder = "Password";
    
    parent.appendChild(br);

    parent.appendChild(username);

    show.addEventListener("click", function() {
        let element = document.getElementById("password-" + this.id);
        let button = document.getElementById(this.id);
        if (element.value == "") return;
        if(element.type === "password") {
            element.type = "text";
            button.innerHTML = "Hide";
        } else {
            element.type = "password";
            button.innerHTML = "Show";
        }
    });
    parent.appendChild(show);

    parent.appendChild(password);
}

function removeIndex () {
    if (count == 0) return;
    let parent = document.getElementById("content2");
    parent.removeChild(parent.lastChild);
    parent.removeChild(parent.lastChild);
    parent.removeChild(parent.lastChild);
    parent.removeChild(parent.lastChild);
    count--;
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

function generate() {
    const specialCharacters = [];
    const characters = [];
    if (document.getElementById('!').checked) { specialCharacters.push('!'); }
    if (document.getElementById('?').checked) { specialCharacters.push('?'); }
    if (document.getElementById('#').checked) { specialCharacters.push('#'); }
    if (document.getElementById('@').checked) { specialCharacters.push('@'); }
    if (document.getElementById('-').checked) { specialCharacters.push('-'); }
    if (document.getElementById('$').checked) { specialCharacters.push('$'); }
    if (document.getElementById('_').checked) { specialCharacters.push('_'); }
    if (document.getElementById('.').checked) { specialCharacters.push('.'); }
    if (document.getElementById(':').checked) { specialCharacters.push(':'); }
    if (document.getElementById('%').checked) { specialCharacters.push('%'); }
    if (document.getElementById('&').checked) { specialCharacters.push('&'); }
    if (document.getElementById('*').checked) { specialCharacters.push('*'); }
    if (document.getElementById('=').checked) { specialCharacters.push('='); }
    var length = parseInt(document.getElementById('length').value);

    // NaN check
    if (isNaN(length)) return;

    // filter non-integer characters after NaN check
    if (length.toString().includes('.')) { length = length.replaceAll('.', ''); }
    if (length.toString().toLowerCase().includes('e')) { length = length.replaceAll('e', ''); }

    // Convert back to integrer after cleaning up with filters
    length = parseInt(length);

    // Iterate based on length value
    for (let i = 0; i < length; i++) {
        // Pick random character from charset
        let random = Math.floor(Math.random() * charset.length);
        characters.push(charset[random]);
    }

    if (specialCharacters.length > characters.length) return;
    characters.splice(0, specialCharacters.length)
    var password = shuffle(characters.concat(specialCharacters));

    if (document.getElementById('nospecialatbeginning').checked) {
        if (specialCharacters.length == length) return;
        if (specialCharacters.length >= length + 2) return;
        while (specialCharacters.includes(password[0]) || specialCharacters.includes(password[password.length -1])) {
            password = shuffle(password);
        }
    }

    const sanitized = password.toString().replaceAll(',', '');
    return sanitized;
}