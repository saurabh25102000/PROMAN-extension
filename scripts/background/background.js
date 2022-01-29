// completely isolated from popup and user page
// complete access of chrome apis
// alone it can't access , modify the DOM property of page, but together with content_script
// they can do whichever is possible, content_script accesses the DOM prop of page and send the mssg to background.js, then with the help of chrome apis , it can modify the DOM prop and send back again to content_scripts

//set all keys in the storage when installed
const durKey = "dur";
const flagKey = "flags";
const todosKey = "todos";
const alarmsKey = "alarms";
const settingsKey = "settings";
const bookmarksKey = "bookmarks";
const sitesToBeBlockedKey = "sitesToBeBlocked";//for localStorage
var extensionId = "";
//get extension id
chrome.management.getSelf((extensionInfo)=>{
    console.log(extensionInfo);
    if(extensionInfo.name === "PROMAN extension"){
        extensionId = extensionInfo.id;
    }
});

//1: do nothing
//2: block
//3: unblock
chrome.runtime.onInstalled.addListener((details)=>{
    if(details.reason == 'install'){
        console.log('extension installed');
        chrome.storage.sync.set({ 
            [flagKey]: {'block': 2, 'blockPattern': true, 'blockAll': false, 'surfTime': false } ,
            [bookmarksKey]: { } ,
            [alarmsKey]: { } ,
            [durKey]: {  } ,
            [settingsKey]: { 'alarmAlert': false, 'breakAlert': false, 'todoAlert': false } ,
            [todosKey]: [ ]
        });
        //set local storage
        var sitesToBeBlocked = [];
        localStorage.setItem(sitesToBeBlockedKey, JSON.stringify(sitesToBeBlocked));
    }
    
});

chrome.storage.sync.set({ 
    [flagKey]: {'block': 2, 'blockPattern': true, 'blockAll': false, 'surfTime': false } 
});

/*
do not block options page and custom block page
const optionsPageUrl = 'chrome-extension://gadcdahkboipobjjcdcgimieefddomca/options/options.html';
const newTabUrl = 'chrome-extension://gadcdahkboipobjjcdcgimieefddomca/newTab/newTab.html';
const popupUrl = 'chrome-extension://gadcdahkboipobjjcdcgimieefddomca/popup/popup.html';
*/
// struggling with asynchronous nature of the chrome.storage.sync 's callback, 
// related question is published on stackoverflow

    function blockListener(details) {  
        if(details.url.search(extensionId) > -1){
            return {
                cancel: false
            };
        }else{
            var sites = JSON.parse(localStorage.getItem(sitesToBeBlockedKey));//got sites array
            var host = getLocation(details.url).host;
            if(sites && sites.includes(host)){
                return {
                    cancel: true
                };
            }else{
                return {
                    cancel: false
                };
            }
        }
    }
/*
in above function blockListener i have struggeled with the blocking of the requests which were not in main_frame,,
no matter in which frame they are.. i was blocking only main_frame requests because of which some requests which were in script, ping, image type frame are not blocked and i was not able to figure out for 2 days then after lot of debugging i have found the issue and then removed the types of frame i.e. main_frame form the webRequest and after then i am anle to block the user want , no matter the request in which frame.
*/
    
    function checkBlockRequest(){
        chrome.storage.sync.get(null,items=>{
            var flagsObj = items[flagKey];
           
            if(flagsObj["block"] === 1){
                return;
            }
            if(flagsObj["block"] === 2){
                chrome.webRequest.onBeforeRequest.addListener( blockListener, { urls: ["<all_urls>"] }, ['blocking'] );
                flagsObj["block"] = 1;
                chrome.storage.sync.set({[flagKey]: flagsObj});
            }else if(flagsObj["block"] === 3){
                chrome.webRequest.onBeforeRequest.removeListener( blockListener );
                flagsObj["block"] = 2;
                chrome.storage.sync.set({[flagKey]: flagsObj});
                //again onChanged event is fired and remaining sites will again blocked
            }
        });
    }

    chrome.storage.onChanged.addListener((changes, area)=>{
        if( area == 'sync' && changes.flags?.newValue ){
            checkBlockRequest();
        }
    });
    checkBlockRequest();


//alarm management =========================================================

const alarmTone = chrome.runtime.getURL("/resources/alarm1.mp3");
const alarmSound = new Audio(alarmTone);
// chrome.alarms api
chrome.runtime.onMessage.addListener(function (request,sender,sendResponse) { 
    if(request.purpose == 'set'){
        var alarmInfo = {};
        if(!isNaN(request.period)){
            alarmInfo = {
                when: Date.now() + request.msInterval,
                periodInMinutes: request.period, 
            };
        }else{
            alarmInfo = {
                when: Date.now() + request.msInterval,
            };
        }
        //create an alarm based on request
        chrome.alarms.create(request.alarmName, alarmInfo);
        sendResponse({'status': request.alarmName+' alarm is successfully set'});
    }
});

//onAlarm event 
chrome.alarms.onAlarm.addListener(function (alarm) { 
    //console.log(alarm);
    //alarm notification details=====================
    const now = new Date();
    const alarmTitle = alarm.name + ' ALERT!!!';
    const alarmMsg = 'Dear folk\nthe time is ' + now.toLocaleTimeString() + ' and it is basic reminder for '+ alarm.name;
    const alarmoptions = {
        type: 'basic',
        title: alarmTitle,
        message: alarmMsg,
        iconUrl: '/icons/alarm-clock.png',
        eventTime: 5000
    };

    chrome.notifications.create('alarm', alarmoptions, (notificationId)=>{//show alarm notification
        //console.log(notificationId + ' notofication created successfully');
    }); 
    //alarm notification end==============================
    
    chrome.storage.sync.get(null,(items)=>{
        //first check if user enabled alarm-alert switch or not
        if(items[settingsKey]['alarmAlert']){
            alarmSound.play();//play the alarm sound
        }
        //check if alarm period is once
        if(isNaN(alarm['periodInMinutes'])){//if yes
            //remove from the object value of "alarms" key
            var alarmsValue = items[alarmsKey];//get the "alarms" value object
            //delete the key.value pair
            delete(alarmsValue[alarm.name]);
            //set object back again
            chrome.storage.sync.set( { [alarmsKey]: alarmsValue });
        
            setTimeout(()=>{
                chrome.runtime.sendMessage({'name': alarm.name, 'purpose': 'removeOneTime'});
            },500);
        }
    });
    
});

//clear the alarm requested
//listen the request to remove the alarm
chrome.runtime.onMessage.addListener(function (request,sender,sendResponse) { 
    //remove the alarm by using its name
    if(request.purpose == 'remove'){
        chrome.alarms.clear(request.name);
        sendResponse({'status': request.name+' alarm is successfully removed'});
    }
});


//browsing time management ============================================================================
//notification details===========================
const breakTitle = 'BREAK TIME ALERT!!!'
const breakMsg = 'Dear folk\nIt is break time and all sites are blocked. Take some rest now.';

const breakoptions = {
    type: 'image',
    title: breakTitle,
    message: breakMsg,
    iconUrl: '/images/time-to-market128.png',
    imageUrl: '/images/notimage.jpeg',
    requireInteraction: true
  };
//notification details end=====================

const breakTone = chrome.runtime.getURL("/resources/break_alarm.mp3");
const breakSound = new Audio(breakTone);
const todoTone = chrome.runtime.getURL("/resources/wtf_message.mp3");
const todoSound = new Audio(todoTone);
//set a timer which will keep track of browsing time
var startDate = new Date();
var elapsedTime = 0;
setInterval(()=>{
    elapsedTime = Math.round((new Date() - startDate)/1000);
    //check for break time 
    var check = 0;
    if(target_for_break == elapsedTime){
        target_for_break = -1;
        //console.log('breakover======================');
        chrome.runtime.sendMessage({'purpose': 'breakover'});
        check = 1;
    }

    chrome.storage.sync.get(null, (items)=>{
        //block all urls if check is true ===========================================
        if(check){
            //console.log(check);
            chrome.notifications.create('break', breakoptions, (notificationId)=>{//show break notification
               //console.log(notificationId + ' notification created successfully');
            });      

            var f = items[flagKey];
            f['surfTime'] = true;
            chrome.storage.sync.set({[flagKey]: f });
            //first check if user enabled break-alert switch or not
            if(items[settingsKey]['breakAlert']){
                breakSound.play();//play break sound
            }
            //block all urls on break
            chrome.webRequest.onBeforeRequest.addListener((details)=>{
                if(details.url.search(extensionId) > -1){
                    return {
                        cancel: false
                    };
                }else{
                    return {
                        cancel: true
                    };
                }
            },{urls: ["<all_urls>"]},['blocking']);
        }
        //todo management ===========================================================
        var todos = items[todosKey];
        var statusChanged = 0;
        todos.forEach( i => {
            var start = new Date(i['start']);
            var end = new Date(i['end']);
            var now = new Date();
            //default status is 'todo'
            if(now.toLocaleString() == start.toLocaleString()){
                //console.log('now === start');
                i['status'] = 'ongoing';
                statusChanged = 1;

                const todoMsg = 'Hey your scheduled task ' + i['title'] + ' has started now.';
                const todoOptions = {
                    type: 'image',
                    title: i['title'] + ' task reminder',
                    message: todoMsg,
                    iconUrl: '/images/time-to-market128.png',
                    imageUrl: '/images/todo.png',
                    requireInteraction: true
                };
                chrome.notifications.create('todo', todoOptions, (notificationId)=>{//give user basic notification to let them 
                   // console.log(notificationId, ' notification created successfully');
                });
                
                if(items[settingsKey].todoAlert){
                    todoSound.play();
                }
            }
            if(now.toLocaleString() === end.toLocaleString()){
                i['status'] = 'done'; 
                statusChanged = 1;
            }
            if(statusChanged === 1){
                chrome.storage.sync.set({[todosKey]: todos});
                statusChanged = 0;
            } 
        });
         
    });
},1000);

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    if(request.popup == 'open'){
        //console.log('popup is open');
        chrome.runtime.sendMessage({'elapsedTime': elapsedTime, 'purpose': 'spent'});
    }
});
//break time management=========================================================================

//block all urls if break is over===============================================================
var target_for_break = -1;
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    if(request.purpose == 'break'){
        var curr = elapsedTime;//seconds
        var dur = request.duration;//seconds
        target_for_break = curr + dur;
    }
});

function getLocation(href) {  
    var loc = document.createElement('a');
    loc.href = href;
    return loc;
}