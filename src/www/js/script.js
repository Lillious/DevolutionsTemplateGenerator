var count = 0;
const { ipcRenderer } = require('electron');
const clipboardy = require('node-clipboardy');
const fs = require('node:fs');
const fse = require('fs-extra');
const fetch = require('node-fetch');
const extract = require('extract-zip');
const path = require('node:path');

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

const File = {
    async extract(source, target) {
        try {
            await extract(source, {
                dir: target
            })
        } catch (err) {
            throw err;
        }
    }
}

const Notification = {
    show(mode, message) {
        const container = document.getElementById('content');
        const NotificationContainer = document.createElement('div');
        const NotificationContent = document.createElement('div');
        NotificationContainer.classList.add('notification-bar');
        NotificationContent.classList.add('notification-content');
        NotificationContent.innerHTML = message;
        NotificationContainer.appendChild(NotificationContent);
        NotificationContainer.style.marginTop = `${50 * document.getElementsByClassName('notification-bar').length}px`;
        switch (mode) {
            case 'success':
                NotificationContainer.style.borderRight = '4px solid #61c555';
                break;
            case 'error':
                NotificationContainer.style.borderRight = '4px solid #ed6a5e';
                break;
            case 'information':
                NotificationContainer.style.borderRight = '4px solid #3f78c4';
                break;
            case 'warn':
                NotificationContainer.style.borderRight = '4px solid #f4c04e';
                break;
            default:
                NotificationContainer.style.borderRight = '4px solid #3f78c4';
                break;
        }
        container.appendChild(NotificationContainer);
        this.clear(NotificationContainer);
    },
    clear(notification) {
        setTimeout(() => {
            const notifications = document.getElementsByClassName('notification-bar');
            for (let i = 0; i < notifications.length; i++) {
                notifications[i].style.marginTop = `${50 * i - 50}px`;
            }
            notification.remove();
        }, 3000);
    }
}

Notification.show("information", "Checking for updates...");

const save = document.getElementById('save');
save.addEventListener('click', () => {
    const Accounts = [];
    const SiteInformation = [];
    let usernames = document.getElementsByClassName('username-input');
    let passwords = document.getElementsByClassName('password-input');
    for (let i = 0; i < count; i++) {
        let username = usernames[i].value;
        let password = passwords[i].value;
        if (username && password) {
            Accounts.push({[username]: `${password}`});
        }
    }
    let siteName = document.getElementsByClassName(`site-name`)[0].getElementsByTagName('input')[0].value || '';
    let accountNumber = document.getElementsByClassName(`account-number`)[0].getElementsByTagName('input')[0].value || '';
    let munisVersion = document.getElementsByClassName(`munis-version`)[0].getElementsByTagName('input')[0].value || '';
    let engagementType = document.getElementsByClassName(`engagement-type`)[0].getElementsByTagName('input')[0].value || '';
    let engagementDate = document.getElementsByClassName(`engagement-date`)[0].getElementsByTagName('input')[0].value || '';
    SiteInformation.push({Name: `${siteName}`, Account_Number: `${accountNumber}`, Munis_Version: `${munisVersion}`, Engagement_Type: `${engagementType}`, Engagement_Date: `${engagementDate}`});
    ipcRenderer.send('save', Accounts, SiteInformation);
});

// Autosave every 30 seconds
setInterval(() => {
    save.click();
}, 30000);

// Load entries from config file
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../www/config.json'), 'utf8'));
const Accounts = config.Accounts;
const SiteInformation = config.Site_Information;
if (Accounts?.length) {
    for (let i = 0; i < Accounts.length; i++) {
        addEntry();
        let username = Object.keys(Accounts[i])[0];
        let password = Accounts[i][username];
        document.getElementsByClassName('username-input')[i].value = username;
        document.getElementsByClassName('password-input')[i].value = password;
    }
}
// Load site information from config file
if (SiteInformation) {
    document.getElementsByClassName(`site-name`)[0].getElementsByTagName('input')[0].value = SiteInformation[0]?.Name || '';
    document.getElementsByClassName(`account-number`)[0].getElementsByTagName('input')[0].value = SiteInformation[0]?.Account_Number || '';
    document.getElementsByClassName(`munis-version`)[0].getElementsByTagName('input')[0].value = SiteInformation[0]?.Munis_Version || '';
    document.getElementsByClassName(`engagement-type`)[0].getElementsByTagName('input')[0].value = SiteInformation[0]?.Engagement_Type || '';
    document.getElementsByClassName(`engagement-date`)[0].getElementsByTagName('input')[0].value = SiteInformation[0]?.Engagement_Date || '';
}

// Clear config file
const yes = document.getElementById('areyousure-yes');
const no = document.getElementById('areyousure-no');
const popup = document.getElementById('areyousure-container');
const opacity = document.getElementById('opacity');
// Check if both buttons exist and add event listeners
if (yes && no) {
    yes.addEventListener('click', () => {
        popup.style.display = 'none';
        opacity.style.display = 'none';
        ipcRenderer.send('clear');
        location.reload();
    });
    no.addEventListener('click', () => {
        popup.style.display = 'none';
        opacity.style.display = 'none';
    });
}

const clear = document.getElementById('clear');
clear.addEventListener('click', () => {
    // Are you sure popup
    popup.style.display = 'block';
    // Auto focus on no button
    no.focus();
    // Enable opacity
    opacity.style.display = 'block';
});

// Import config file
const importConfig = document.getElementById('import-config');
importConfig.addEventListener('click', () => {
    document.getElementById('import-config-file').click();
    // Read file
    document.getElementById('import-config-file').addEventListener('change', () => {
        const file = document.getElementById('import-config-file').files[0];
        if (file.type != 'application/json') return Notification.show('error', 'Error importing config file');
        // move file to www folder
        const cwd = path.join(__dirname, '../www/config.json');
        fs.copyFile(file.path, cwd, (err) => {
            if (err) {
                Notification.show('error', 'Error importing config file');
            } else {
                Notification.show('success', 'Imported config file');
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        });
    });
});

// Export config file
const exportConfig = document.getElementById('export-config');
exportConfig.addEventListener('click', () => {
    // Create anchor element
    const a = document.createElement('a');
    a.style.display = 'none';
    a.setAttribute('href', '../www/config.json');
    a.setAttribute('download', 'config.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

const addEntryButton = document.getElementById('add-entry');
addEntryButton.addEventListener('click', addEntry);
document.getElementById('spoiler-generate').getElementsByTagName('a')[0].addEventListener('click', addEntry);

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

function reformatDate (date) {
    let parts = date.split('-');
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
}

const exportCSV = document.getElementById('export');
exportCSV.addEventListener('click', () => {
    const usernames = document.getElementsByClassName('username');
    if (usernames.length === 0) return Notification.show('error', 'No entries to export');
    // Check if there are duplicate usernames
    let usernamesArray = [];
    for (let i = 1; i < usernames.length +1; i++) {
        let string = document.getElementById(`username-${i}`).value;
        let username = string.split("/")[1];
        usernamesArray.push(username);
    }
    let uniqueUsernames = [...new Set(usernamesArray)];
    if (uniqueUsernames.length != usernamesArray.length) return Notification.show('error', 'Duplicate usernames found');
    for (let i = 1; i < usernames.length +1; i++) {
        let string = document.getElementById(`username-${i}`).value;
        let siteName = document.getElementsByClassName(`site-name`)[0].getElementsByTagName('input')[0].value;
        let accountNumber = document.getElementsByClassName(`account-number`)[0].getElementsByTagName('input')[0].value;
        let munisVersion = document.getElementsByClassName(`munis-version`)[0].getElementsByTagName('input')[0].value;
        let engagementType = document.getElementsByClassName(`engagement-type`)[0].getElementsByTagName('input')[0].value;
        let engagementDate = document.getElementsByClassName(`engagement-date`)[0].getElementsByTagName('input')[0].value;
        let group = `${siteName} - ${accountNumber}\\Munis ${munisVersion} ${engagementType} - ${reformatDate(engagementDate)}\\${string.split("/")[0]}`;
        let username = string.split("/")[1];
        let usergroup = string.split("/")[0];
        let hiddenpassword = document.getElementById(`password-${i}`);
        hiddenpassword.type = "text";
        let password = hiddenpassword.value;
        hiddenpassword.type = "password";
        if (usergroup === "") return Notification.show('error', 'Username cannot be empty');
        if (!string.includes('/')) return Notification.show('error', 'Username must be in the format of "group/username"');
        if (username === "") return Notification.show('error', 'Username cannot be empty');
        if (password === "") return Notification.show('error', 'Password cannot be empty');
        if (siteName === "") return Notification.show('error', 'Site Name cannot be empty');
        if (accountNumber === "") return Notification.show('error', 'Account Number cannot be empty');
        if (munisVersion === "") return Notification.show('error', 'Munis Version cannot be empty');
        if (engagementType === "") return Notification.show('error', 'Engagement Type cannot be empty');
        if (engagementDate === "") return Notification.show('error', 'Engagement Date cannot be empty');

        if (typeof siteName != 'string') return Notification.show('error', 'Site Name could not be parsed as text');
        if (isNaN(parseInt(accountNumber))) return Notification.show('error', 'Account Number could not be parsed as an integer');
        if (isNaN(parseInt(munisVersion))) return Notification.show('error', 'Munis Version could not be parsed as an integer');
        if (typeof engagementType != 'string') return Notification.show('error', 'Engagement Type could not be parsed as text');
        if (validateDate(engagementDate) === false) return Notification.show('error', 'Engagement Date could not be parsed as a date');
        if (typeof string != 'string') return Notification.show('error', 'Username could not be parsed as text');
        if (typeof password != 'string') return Notification.show('error', 'Password could not be parsed as text');
        generateCSV(username.toLowerCase(), password, group);
    }
    data.unshift([Title]);
    var report = data.map(function(d){
        return d.join(',');
    }).join('\n').replace(/(^\[)|(\]$)/mg, '');
    downloadFile(`Devolutions-Report-${formatDate()}.csv`, report);
    data = [];
    return Notification.show('success', 'Report exported successfully');
});

function addEntry() {
    count++;
    let parent = document.getElementsByClassName("scroll-box-content")[1];
    let entry = document.createElement("div");
    entry.className = "entry";
    parent.appendChild(entry);
    // Add delete button
    let deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.innerHTML = "X";
    
    deleteButton.addEventListener('click', () => {
        parent.removeChild(entry);
        count--;
        if (count == 0) {
            document.getElementById('spoiler-generate').style.display = 'block';
        }
    });
    entry.appendChild(deleteButton);
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
    passwordInput.addEventListener('contextmenu', () => {
        if (passwordInput.value === "") return;
        if (passwordInput.type === "text") return;
        passwordInput.type = "text";
        setTimeout(() => {
            passwordInput.type = "password";
        }, 5000);
    });

    passwordInput.addEventListener('dblclick', () => {
        // Copy to clipboard if not empty
        if (passwordInput.value === "") return;
        clipboardy.write(passwordInput.value)
            .then(() => {
                Notification.show('success', 'Password copied to clipboard');
            })
            .catch(() => {
                Notification.show('error', 'Unable to copy password to clipboard');
            });
    });
    entry.appendChild(password);
    if (document.getElementById('spoiler-generate')) {
        document.getElementById('spoiler-generate').style.display = 'none';
    }
}

const letters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
const numbers = ["0","1","2","3","4","5","6","7","8","9"];
const generatePassword = document.getElementById('generate-password');
generatePassword.addEventListener("click", generateAll);


function generate() {
    const specialCharacters = [];
    const characters = [];
    specialCharacters.push('!');
    specialCharacters.push('@');

    // Iterate based on length value
    for (let i = 0; i < 16; i++) {
        // 50% chance of picking a letter or number
        let charset = Math.random() > 0.5 ? letters : numbers;
        characters.push(charset[Math.floor(Math.random() * charset.length)]);
    }

    if (specialCharacters.length > characters.length) return;
    characters.splice(0, specialCharacters.length)
    var password = shuffle(characters.concat(specialCharacters));

    // Prevent password from starting with a special character
    while (specialCharacters.includes(password[0]) || specialCharacters.includes(password[password.length -1])) {
        password = shuffle(password);
    }

    if (!password.some(char => numbers.includes(char))) {
        let index = password.findIndex(char => !specialCharacters.includes(char));
        password[index] = numbers[Math.floor(Math.random() * numbers.length)];
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

const searcbar = document.getElementById('searchbar');
// Check if control f was pressed
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'f') {
        if (searcbar.style.display === 'block') {
            searcbar.style.display = 'none';
            // Remove search highlight
            let usernames = document.getElementsByClassName('username-input');
            for (let i = 0; i < count; i++) {
                usernames[i].style.backgroundColor = 'transparent';
            }
        } else {
            searcbar.style.display = 'block';
            searcbar.getElementsByTagName('input')[0].focus();
        }
    }
});

searcbar.getElementsByTagName('input')[0].addEventListener('keyup', (event) => {
    // Check if enter was pressed
    if (event.key === 'Enter') {
        const search = event.target.value.toLowerCase();
        let usernames = document.getElementsByClassName('username-input');
        let mode = document.getElementsByClassName('card-mode')[1];
        if (mode.innerHTML === '+') {
            mode.click();
        }
        for (let i = 0; i < count; i++) {
            let username = usernames[i].value;
            if (username.toLowerCase().includes(search)) {
                // Highlight
                usernames[i].style.backgroundColor = 'rgba(59, 125, 212, 0.5)'
            } else {
                usernames[i].style.backgroundColor = 'transparent';
            }
        }

        // Scroll to first match
        for (let i = 0; i < count; i++) {
            if (usernames[i].style.backgroundColor === 'rgba(59, 125, 212, 0.5)') {
                usernames[i].scrollIntoView();
                break;
            }
        }
    }
});

/* Tooltip logic */
const tooltip = document.getElementById('tooltip');
save.addEventListener('mouseover', () => {
    tooltip.style.opacity = '1';
    tooltip.innerHTML = 'Save to the configuration file manually';
    tooltip.style.zIndex = '1000';
});

save.addEventListener('mouseout', () => {
    tooltip.style.opacity = '0';
    tooltip.style.zIndex = '-1';
});

clear.addEventListener('mouseover', () => {
    tooltip.style.opacity = '1';
    tooltip.innerHTML = 'Clear the configuration file and reset the page';
    tooltip.style.zIndex = '1000';
});

clear.addEventListener('mouseout', () => {
    tooltip.style.opacity = '0';
    tooltip.style.zIndex = '-1';
});

importConfig.addEventListener('mouseover', () => {
    tooltip.style.opacity = '1';
    tooltip.innerHTML = 'Import a configuration file from disk';
    tooltip.style.zIndex = '1000';
});

importConfig.addEventListener('mouseout', () => {
    tooltip.style.opacity = '0';
    tooltip.style.zIndex = '-1';
});

exportConfig.addEventListener('mouseover', () => {
    tooltip.style.opacity = '1';
    tooltip.innerHTML = 'Export a configuration file to disk';
    tooltip.style.zIndex = '1000';
});

exportConfig.addEventListener('mouseout', () => {
    tooltip.style.opacity = '0';
    tooltip.style.zIndex = '-1';
});

generatePassword.addEventListener('mouseover', () => {
    tooltip.style.opacity = '1';
    tooltip.innerHTML = 'Generate passwords for all entries with empty password fields';
    tooltip.style.zIndex = '1000';
});

generatePassword.addEventListener('mouseout', () => {
    tooltip.style.opacity = '0';
    tooltip.style.zIndex = '-1';
});

addEntryButton.addEventListener('mouseover', () => {
    tooltip.style.opacity = '1';
    tooltip.innerHTML = 'Add a new entry';
    tooltip.style.zIndex = '1000';
});

addEntryButton.addEventListener('mouseout', () => {
    tooltip.style.opacity = '0';
    tooltip.style.zIndex = '-1';
});

exportCSV.addEventListener('mouseover', () => {
    tooltip.style.opacity = '1';
    tooltip.innerHTML = 'Export all entries to a CSV file';
    tooltip.style.zIndex = '1000';
});

exportCSV.addEventListener('mouseout', () => {
    tooltip.style.opacity = '0';
    tooltip.style.zIndex = '-1';
});

// Read package.json to get version
const package = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../app/package.json'), 'utf8'));
const version = package.version;
document.getElementById('version').innerHTML = `v${version}`;


Update();

// Check for updates
function Update () {
    fetch("https://api.github.com/repos/Lillious/DevolutionsTemplateGenerator/releases/latest")
        .then(res => res.json())
            .then(json => {
                if (json.tag_name !== version) {
                    Notification.show("information", `Update available: ${json.tag_name}`);
                    Notification.show("information", "Downloading update...");
                    download({
                        url: json.assets[0].browser_download_url,
                        fileName: "update.zip",
                        temp: "./temp-update",
                    }).then(() => {
                        Notification.show("information", "Extracting update...");
                        File.extract("./temp-update/update.zip", path.join(__dirname, '..', '..', '..', '..', 'update'))
                        .then(() => {
                            const src = path.join(__dirname, '..', '..', '..', '..', 'update', 'resources', 'app', 'src');
                            const dest = path.join(__dirname, '..', '..', '..', '..', 'resources', 'app', 'src');
                            const packageSrc = path.join(__dirname, '..', '..', '..', '..', 'update', 'resources', 'app', 'package.json');
                            const packageDest = path.join(__dirname, '..', '..', '..', '..', 'resources', 'app', 'package.json');
                            const mainSrc = path.join(__dirname, '..', '..', '..', '..', 'update', 'resources', 'app', 'app.js');
                            const mainDest = path.join(__dirname, '..', '..', '..', '..', 'resources', 'app', 'app.js');
                            const modulesSrc = path.join(__dirname, '..', '..', '..', '..', 'update', 'resources', 'app', 'node_modules');
                            const modulesDest = path.join(__dirname, '..', '..', '..', '..', 'resources', 'app', 'node_modules');
                            try {
                                fse.copySync(src, dest, { overwrite: true });
                            } catch (err) {
                                console.log(`Failed to copy ${src} to ${dest}`);
                            }
                            try {
                                fse.copySync(packageSrc, packageDest, { overwrite: true });
                            } catch (err) {
                                console.log(`Failed to copy ${packageSrc} to ${packageDest}`);
                            }
                            try {
                                fse.copySync(mainSrc, mainDest, { overwrite: true });
                            } catch (err) {
                                console.log(`Failed to copy ${mainSrc} to ${mainDest}`);
                            }
                            try {
                                fse.copySync(modulesSrc, modulesDest, { overwrite: true });
                            } catch (err) {
                                console.log(`Failed to copy ${modulesSrc} to ${modulesDest}`);
                            }
                            
                            Notification.show("information", "Update complete! Restarting...");
                            // Save before forced update
                            save.click();
                            setTimeout(() => {
                                ipcRenderer.send('restart');
                            }, 5000);
                        }).catch((err) => {
                            Notification.show("error", "Failed to extract update");
                        }).finally(() => {
                            fs.rm(path.join(__dirname, '..', '..', '..', '..', 'update'), { recursive: true, force: true }, (err) => {
                                if (err) {
                                    Notification.show("error", "Failed to remove temporary files");
                                }
                            });
                            fs.rm(path.join(__dirname, '..', '..', '..', '..', 'temp-update'), { recursive: true, force: true }, (err) => {
                                if (err) {
                                    Notification.show("error", "Failed to remove temporary files");
                                }
                            });
                        });
                    }).catch((err) => {
                        console.log(err);
                        Notification.show("error", "Update download failed");
                        busy = false;
                    });
                } else {
                    Notification.show("information", "No updates found.");
                }
            }
    );
}

function download (options) {
    var startTime, endTime;
    return new Promise((resolve, reject) => {
        if (!options) reject('No options provided');

        try {
            if (!fs.existsSync(options.temp)) {
                fs.mkdirSync(options.temp, { recursive: true });
            }
        } catch {
            reject('Failed to create temp directory');
        }

        const req = fetch(options.url, { method: 'GET', encoding: null});
        req.then((res) => {
            startTime = new Date().getTime();
            if (res.status !== 200) {
                reject(`Server responded with ${res.status}: ${res.statusText}`);
            }

            const dest = fs.createWriteStream(path.join(options.temp, options.fileName));

            // Write file to disk
            res.body.on('data', (chunk) => {
            }).pipe(dest);

            res.body.on('error', (err) => {
                fs.rm(path.join(options.temp), (err) => { });
                reject(err);
            });

            dest.on('finish', () => {
                endTime = new Date().getTime();
                const timeDiff = endTime - startTime;
                const seconds = Math.round(timeDiff / 1000);
                const bytes = fs.statSync(path.join(options.temp, options.fileName)).size;
                const bps = Math.round(bytes / seconds);
                const kbps = Math.round(bps / 1024);
                const mbps = Math.round(kbps / 1024);
                // Check if mbps is infinity
                if (mbps == Infinity) {
                    Notification.show('information', `Download finished in ${seconds} seconds`);
                    resolve();
                } else {
                    Notification.show('information', `Download finished in ${seconds} seconds (${mbps} MB/s)`);
                    resolve();
                }
            });

            dest.on('error', (err) => {
                reject(err);
            });
        }).catch((err) => {
            reject(err);
        });
    });
}