//todo management =====================================================================================
const addForm = document.querySelector('.add');
const todosList = document.querySelector('.todos');//ul
const search = document.querySelector('.search input');
const taskscount = document.querySelector('.taskscount');
var todo = 0, ongoing = 0, done = 0;
//sites
const genBlockerForm = document.querySelector('#gen-blocker-form');
const genBlockList = document.querySelector('#gen-block-list');
const blockCount = document.querySelector('#blockGenUrlsCount');
const blockedSiteskey = "sitesToBeBlocked";

//load todos function============================================================
function loadtodos() {  
    todo = 0;
    ongoing = 0;
    done = 0;
    todosList.innerHTML = ``;
    chrome.storage.sync.get('todos',(items)=>{
        taskscount.innerHTML = `<span class="badge bg-danger">to-do: ${todo}</span> <span class="badge bg-warning">ongoing: ${ongoing}</span> <span class="badge bg-primary">done: ${done}</span>`;
        var x = items['todos'];
        //console.log(x);
        x.forEach( i => {
            const htmlTemplate = `
                <li class="list-group-item d-flex justify-content-between align-item-center">
                    <span> ${i['title']} <br><span class="badge bg-dark">${i['start']}</span> <i class="fa-thin fa-right-long"></i> <span class="badge bg-dark">${i['end']}</span> <span class="badge bg-info">${i['status']}</span></span>
                    <i class="far fa-trash-alt delete"></i>
                </li>
            `;
            todosList.innerHTML+=htmlTemplate;
            if(i['status'] == 'to-do')  todo++;
            if(i['status'] == 'ongoing') ongoing++;
            if(i['status'] == 'done') done++;
        });
        taskscount.innerHTML = `<span class="badge bg-danger">to-do: ${todo}</span> <span class="badge bg-warning">ongoing: ${ongoing}</span> <span class="badge bg-primary">done: ${done}</span>`;
    });
    
}
loadtodos();//load all todos at once================================================

//load blockedsites function============================================================
function loadsites() {  
    genBlockList.innerHTML = ``;
    var sites = JSON.parse(localStorage.getItem(blockedSiteskey));
    if(sites){
        sites.forEach( u => {
            const htmlTemplate = `<li class="list-group-item d-flex justify-content-between align-item-center">
                                        <span id="site">&#128279;&#9940; ${u}</span> 
                                        <i class="far fa-trash-alt delete"></i>
                                    </li>`;
            genBlockList.innerHTML+=htmlTemplate;
        });
        //count update
        blockCount.innerHTML = `${sites.length} sites blocked`;
    }
}
loadsites();//load all sites at once================================================

//Add todos start================================================================
addForm.addEventListener('submit',e =>{
    e.preventDefault();//prevent default refreshing upon submission

    const todo_title = addForm.add.value.trim();//trim leading and trailing spaces
    const start_date = addForm.startdate.value;
    const end_date = addForm.enddate.value;
    const status = 'to-do';
    const start = new Date(start_date);
    const end = new Date(end_date);

    if(todo_title.length && start_date !== '' && end_date !== '' && start > new Date() && end > new Date() && end > start){
        var x = {title: todo_title, start: start.toLocaleString(), end: end.toLocaleString(), status: 'to-do'};
        //console.log(x);
        chrome.storage.sync.get('todos',(items)=>{
            var y = items['todos'];
            y[y.length] = x;
            chrome.storage.sync.set({'todos': y });
        });
        //appendTodoHtml(todo_title,start.toLocaleString(),end.toLocaleString(),status);
        addForm.reset();
    }else{
        alert('invalid date & time');
    }
});
//Add todos end===================================================================

//if clicked on target trash icon just delete that 
todosList.addEventListener('click',e => {
    if(e.target.classList.contains('delete')){//fine, bcz delete class is specific to trash
        var allElements = Array.from(e.target.parentElement.parentElement.children);
        var elementToFind = e.target.parentElement;
        // console.log(e.target.previousElementSibling.children[4].textContent);
        var index = allElements.indexOf(elementToFind);
        //remove from the storage
        if(index != -1){//element is found at index index
            chrome.storage.sync.get('todos',(items)=>{
                var x = items['todos'];
                x.splice(index, 1);
                chrome.storage.sync.set({'todos': x});
            });
        }else{
            alert('element not found');
        }
        //remove from the page 
        e.target.parentElement.remove();
    }
});
//Delete todos end====================================================================
//search  in todos====================================================================
function filterTodos(term) { 
    //for unmatched, add filtered class
    Array.from(todosList.children)
    .filter(function (todo) { 
        return !todo.textContent.toLowerCase().includes(term);//.includes(term)
     })
    .forEach(function (unmatched) { 
        unmatched.classList.add('filtered');//display none
    })
    //for matched, remove filtered class
    Array.from(todosList.children)
    .filter(function (todo) { 
        return todo.textContent.toLowerCase().includes(term);//.includes(term)
     })
    .forEach(function (matched) { 
        matched.classList.remove('filtered');//display again
    })
}
search.addEventListener('keyup',() => {
    const term = search.value.trim().toLowerCase();
    filterTodos(term);
});

//suppose options is open and status is changed by background.js, then we have to update it in tha page at the instant....
//listen for the event onChanged on chrome.storage when options is open
chrome.storage.onChanged.addListener((changes, area)=>{
    if( area == 'sync' && changes.todos?.newValue ){
        todo = 0;
        ongoing = 0;
        done = 0;
        todosList.innerHTML = ``;
    
        var x = changes.todos.newValue;
        //console.log(x);
        x.forEach( i => {
            const htmlTemplate = `
                <li class="list-group-item d-flex justify-content-between align-item-center">
                    <span> ${i['title']} <br><span class="badge bg-dark">${i['start']}</span> <i class="fa-thin fa-right-long"></i> <span class="badge bg-dark">${i['end']}</span> <span class="badge bg-info">${i['status']}</span></span>
                    <i class="far fa-trash-alt delete"></i>
                </li>
            `;
            todosList.innerHTML+=htmlTemplate;
            if(i['status'] == 'to-do')  todo++;
            if(i['status'] == 'ongoing') ongoing++;
            if(i['status'] == 'done') done++;
        });
        taskscount.innerHTML = `<span class="badge bg-danger">to-do: ${todo}</span> <span class="badge bg-warning">ongoing: ${ongoing}</span> <span class="badge bg-primary">done: ${done}</span>`;
    }
});
//=======================================================================================================

// site blacklisting starts here ===================================================================

//=======================================================================================================
function appendGenUrl(url){
    //console.log(url);
    const genUrlTemplate = `<li class="list-group-item d-flex justify-content-between align-item-center">
                                <span id="site">&#128279;&#9940; ${url}</span> 
                                <i class="far fa-trash-alt delete"></i>
                            </li>`;
    genBlockList.innerHTML += genUrlTemplate;
}

genBlockerForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const genUrl = genBlockerForm.genUrl.value.trim();
    var pattern = new RegExp('^(https?:\\/\\/)?' +
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' +
				'((\\d{1,3}\\.){3}\\d{1,3}))' +
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
				'(\\?[;&a-z\\d%_.~+=-]*)?' +
				'(\\#[-a-z\\d_]*)?$', 'i');
    
    const isValidUrl = genUrl != '' && genUrl.indexOf(".") !== -1 && pattern.test(genUrl);
    if(isValidUrl){
        var append = 0;
        //search for the key , if not found then set
        const hostl = getLocation(genUrl).host;
        var sites = JSON.parse(localStorage.getItem(blockedSiteskey));
        if(sites){
            if(!sites.includes(hostl)){
                //console.log(hostl);
                //add to localstorage
                sites[sites.length] = hostl;
                localStorage.setItem(blockedSiteskey, JSON.stringify(sites));
                //instant count update
                blockCount.innerHTML = `${sites.length} sites blocked`;
                genBlockerForm.reset(); 
                append = 1;
            } else {
                alert("This site is already blocked.\nEnter different site url to block.");
            }
        }else{
            //add to localstorage
            sites[0] = hostl;
            localStorage.setItem(blockedSiteskey, JSON.stringify(sites));
            //instant count update
            blockCount.innerHTML = `${sites.length} sites blocked`;
            genBlockerForm.reset();
            append = 1;
        } 
        if(append){
            //also add to the html list
            appendGenUrl(hostl);
        }
        //update block flag to let the bg.js to block the request coming from this url
        chrome.storage.sync.get('flags',(items)=>{
            var flags = items['flags'];
            flags['block'] = 2;
            chrome.storage.sync.set( { 'flags': flags } );
        });
    }
    loadsites();//load from localStorage on the page
});
//=======================================================================================================

//=====================================================================================================
genBlockList.addEventListener('click',e => {
    if(e.target.classList.contains('delete')){//fine, bcz delete class is specific to trash
        //just hit trial to get the end of link icon
        const siteToRemove = e.target.previousElementSibling.textContent.substring(3).trim();
        
        //remove from the localStorage
        var sites = JSON.parse(localStorage.getItem(blockedSiteskey));
        var idx = sites.indexOf(siteToRemove);
        // console.log(siteToRemove);
        // console.log(sites);
        // console.log(idx);
        // console.log(e.target);
        if(idx > -1){
            //site found => delete that using .splice(idx, 1) which will modify the original array at the instant
            sites.splice(idx, 1);
            localStorage.setItem(blockedSiteskey, JSON.stringify(sites));
        }
        // Also remove from page
        e.target.parentElement.remove();
        //instant count update
        blockCount.innerHTML = `${sites.length} sites blocked`;
        //set block flag value to 3, i.e. remove the blocklistener and again add to the remaining list of sites
        chrome.storage.sync.get('flags',(items)=>{
            var flags = items['flags'];
            flags['block'] = 3;
            chrome.storage.sync.set( { 'flags': flags } );
        }); 
    }
    loadsites();//load from localStorage on the page
});
//=====================================================================================================

function getLocation(href) {  
    var loc = document.createElement('a');
    loc.href = href;
    return loc;
}