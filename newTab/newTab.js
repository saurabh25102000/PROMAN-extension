//greeting para used in greeting management
const greeting = document.querySelector('.navbar-brand');

// search management
const searchForm = document.querySelector('.search-form');
const formSearch = document.querySelector('#form-search');
const subForm = document.querySelector('#submit');

formSearch.addEventListener('submit',e =>{
    e.preventDefault();//prevent default refreshing upon submission
    var searchKey = formSearch.key.value;
    if(searchKey != ""){
        var makeSearchKeyTemplate = 'https://www.google.com/search?q=' + encodeURIComponent(searchKey); 
        var searchedWindow = window.open(makeSearchKeyTemplate, '_self');
    }
    formSearch.reset();
});

// time and date management
const date_time = document.querySelector('.date-time');
const date_string = document.querySelector('.date-string');
const time_string = document.querySelector('.time-string');

//set inerval anonymous function
setInterval(function () {
    const current = new Date();
    var hour = current.getHours();
    var minute = current.getMinutes();
    var second = current.getSeconds();

    if(hour < 10){
        hour = '0'+ hour;
    }
    if(minute < 10){
        minute = '0' + minute;
    }
    if(second < 10){
        second = '0' + second;
    }
    time_string.innerHTML = hour + ':' + minute + ':' + second;

    const date = current.toDateString();
    date_string.innerHTML = date;

    //greeting management in every 1 sec inerval
    if(hour >= 5 && hour < 11){
        greeting.innerHTML = 'Good morning dear! 	&#128512;';
    }else if(hour >= 11 && hour < 12){
        greeting.innerHTML = 'Good noon dear! 	&#128512;';
    }else if(hour >= 12 && hour < 17){
        greeting.innerHTML = 'Good afternoon dear! 	&#128512;';
    }else if(hour >= 17 && hour < 21){
        greeting.innerHTML = 'Good evening dear! 	&#128512;';
    }else {
        greeting.innerHTML = 'Good night dear! 	&#128512;';
    }

}, 1000);

//togglar bar========================================================================
//bookmarks bar
const addBM = document.querySelector('#bookmark');//bookmark button
const addForm = document.querySelector('.add');//form
const BMlist = document.querySelector('.BMlist');//ul
const closeBMform = document.querySelector('#close-BMform');
const msg = document.querySelector('#msg');
const BMcount = document.querySelector('#BMcount');//BM count as superscript

//store in chrome.storage.sync in "bookmarks" key
var key = "bookmarks";

//self invoking function (function () { })();   
setTimeout(() => {
    ( function () {
        //get the value of "bookmarks" key and set the key/value pairs from that object
        var getbmpairsObj = {};
        chrome.storage.sync.get([key], (items) => {
            getbmpairsObj = items[key];
            var getbmkeys = Object.keys(getbmpairsObj);
    
            getbmkeys.forEach( (i) => {
                var t = i;//get the title
                var u = getbmpairsObj[i];//get the url
    
                const Temp = `
                    <li class="d-flex justify-content-between">
                        <a class="dropdown-item " href="${u}">&#128279; ${t} </a>
                        <i class="far fa-trash-alt delete"></i>
                    </li>
                `;
                BMlist.innerHTML+=Temp;//attch the template to the ul
            } );
            //instant count update
            BMcount.innerHTML = Object.entries(items[key]).length;
        });
    })();
}, 100);

//Add bookmark start================================================================
function appendTodoHtml(title,url){
    const htmlTemplate = `
            <li class="d-flex justify-content-between">
                <a class="dropdown-item " href="${url}">&#128279; ${title} </a>
                <i class="far fa-trash-alt delete"></i>
            </li>
    `;
    BMlist.innerHTML+=htmlTemplate;
}

addBM.addEventListener('click',e =>{
    e.preventDefault();//prevent default refreshing upon submission
    addForm.style.display = 'block';//appear form
    closeBMform.style.display = 'block';//close button appears
    
    const title = addForm.title.value.trim();//trim leading and trailing spaces
    const url = addForm.url.value.trim();//trim leading and trailing spaces

    if(title.length && url.length){
        //first search in storage if not found then append otherwise don't
        chrome.storage.sync.get([key],(items)=>{
            if(Object.keys(items[key]).findIndex((t)=>{return t == title;}) == -1){
                //set inside the "bookmarks" key's value Obj
                var bmobject = items[key];//get the "bookmarks" value object
                //add to the object
                bmobject[title] = url;
                //again set the object in "bookmarks" key back 
                chrome.storage.sync.set( {[key]: bmobject} );
                //instant count update
                BMcount.innerHTML = Object.entries(bmobject).length;
                //successfully set inside "bookmarks" key on chrome.storage

                appendTodoHtml(title,url);
                addForm.reset();

                addForm.style.display = 'none';//disappear form
                closeBMform.style.display = 'none';//close button disappears
                //success msg appears
                msg.style.display = 'block';
                msg.innerHTML = `&#9989; bookmark added succesfully.......`;
            } else {
                //failure msg appears
                msg.style.display = 'block';
                msg.innerHTML = `&#10060; cannot add duplicate bookmark.......`;
            }
            //msg disappears
            setTimeout(function() {
                    msg.style.display = 'none';
            }, 2000);
        });
    }
});
//Add bookmark end===================================================================

//close-BM form starts here============================================================
closeBMform.addEventListener('click',() => {
    addForm.reset();//reset form first
    addForm.style.display = 'none';//disappear form
    closeBMform.style.display = 'none';//close button disappears
});
//close-BM form ends here=============================================================

//Delete bookmarks on clicking on trash icon==========================================
//we will use event delegation for deletion,if we don't do this, we will get in trouble 
//with newly added bookmarks
//we will add eventListener to whole ul, which will delegate
//if clicked on target trash icon just delete that 
BMlist.addEventListener('click',e => {
    // if(e.target.nodeName=='I'){//what if we have several I tag 
    //     console.log(e.target.parentElement);
    // }
    if(e.target.classList.contains('delete')){//fine, bcz delete class is specific to trash
        //just hit trial to get the end of link icon
        const titleToRemove = e.target.previousElementSibling.textContent.substring(3).trim();
        //remove from the object value of "bookmarks" key
        chrome.storage.sync.get([key],(items)=>{
            var bookmarksValue = items[key];//get the "bookmarks" value object
            //delete the key.value pair
            delete(bookmarksValue[titleToRemove]);
            //set object back again
            chrome.storage.sync.set( { [key]: bookmarksValue } );
            //instant count update
            BMcount.innerHTML = Object.entries(bookmarksValue).length;
        });

        // Also remove from page
        e.target.parentElement.remove();
    }
});
//Delete bookmarks end====================================================================

