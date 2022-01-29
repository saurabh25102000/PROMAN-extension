//this is js file to manage popup of extension
//no access of chrome apis
const body = document.querySelector('body');
const optionsButton = document.querySelector('#go-to-options');
const features_btn = document.querySelector('.feature-btn');
const features_container = document.querySelector('.display-features');

features_btn.addEventListener('click', ()=>{
  if(features_container.style.display == 'block'){
    features_container.style.display = 'none';
    features_btn.style.background = 'linear-gradient(to right, #fcb045, #fd1d1d, #833ab4) ';
  }else{
    features_container.style.display = 'block';
    features_btn.style.background = 'cyan';
  }
});

optionsButton.addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL(','));
  }
});
//alarm management=========================================================
const alarmForm = document.querySelector('.alarm-form');
const alarmTime = document.querySelector('.alarm-time');
//break time management====================================================
const breakTime  = document.querySelector('.break-time');
var bdf = document.querySelector('#bdf');//break duration form

//first load alarms============================================
function loadAlarms() {  
  alarmTime.innerHTML = '';
  chrome.storage.sync.get('alarms',(items)=>{
    var alarmsObj = items['alarms'];
    var alarmsKey = Object.keys(alarmsObj);
    alarmsKey.forEach((i)=>{
      if(!isNaN(alarmsObj[i].period)){
        const template = `<p class="alarm-item"><i class="far fa-bell"></i> <b>[${i}] </b><i class="fa-light fa-right-long"></i> ${alarmsObj[i].time} <br> <b class="period">Period: ${alarmsObj[i].period} min</b> <button class="remove">remove</button></p>`;
        alarmTime.innerHTML += template;
      }else{
        const template = `<p class="alarm-item"><i class="far fa-bell"></i> <b>[${i}] </b><i class="fa-light fa-right-long"></i> ${alarmsObj[i].time} <br> <b class="period">Period: Once</b> <button class="remove">remove</button></p>`;
        alarmTime.innerHTML += template;
      }
    });
  });
}
loadAlarms();//load all alarms

//load duration================================================
function loadDur() {  
  chrome.storage.sync.get(null,(items)=>{
    var f = items['flags'];
    var dur = items['dur'];
    if(!f['surfTime']){//if break is not over
      //either break is pending(set) or not set
      if(dur['time'] && dur['time'] != -1){//if pending or set
        breakTime.innerHTML = `<p><i class="fas fa-coffee feature-btn"></i> Break after <b><big>${dur['time']} minutes</big></b> from ${dur['now']}<br><br><b class="warning"><i class="fas fa-exclamation-triangle"></i> </b><small>please do not disable the extension until break time is reached. If in case you had disabled extension before completion of above displayed break time, Please set again.</small></p>`;
      }
    }else{
      //set surfTime flag to false
      f['surfTime'] = false;
      //and also erase from storage
      //set duration time to default -1
      dur['time'] = -1;
      chrome.storage.sync.set({'flags': f, 'dur': dur});
    }
  });
}
loadDur();//load duration time

//load settings
function loadSettings() {  
  chrome.storage.sync.get('settings', (items)=>{
    document.querySelector('#break-alert').checked = items['settings']['breakAlert'];
    document.querySelector('#alarm-alert').checked = items['settings']['alarmAlert'];
    document.querySelector('#todo-alert').checked = items['settings']['todoAlert'];
  });
}
loadSettings();//load settings

//get sound settings=====================================================
const breakSwitch = document.querySelector('#break-alert');
const alarmSwitch = document.querySelector('#alarm-alert');
const todoSwitch = document.querySelector('#todo-alert');
chrome.storage.sync.get(null,(items)=>{
  var settings = items['settings'];
  breakSwitch.addEventListener('click',()=>{
      settings['breakAlert'] = breakSwitch.checked;
      chrome.storage.sync.set({'settings': settings});
  });
  alarmSwitch.addEventListener('click',()=>{
      settings['alarmAlert'] = alarmSwitch.checked; 
      chrome.storage.sync.set({'settings': settings});
  });
  todoSwitch.addEventListener('click',()=>{
      settings['todoAlert'] = todoSwitch.checked;
      chrome.storage.sync.set({'settings': settings});
  });
  
});

//add an alarm============================================================
alarmForm.addEventListener('submit',(e)=>{
  e.preventDefault();
  var alarmName = alarmForm.name.value.toUpperCase();//1
  var dateTime = alarmForm.scheduledTime.value;
  var period = parseInt(alarmForm.period.value);//default number input returns string//1.2

  var currentDate = new Date();
  var scehduledDate = new Date(dateTime);
  var msInterval = scehduledDate - currentDate;
  var localeString = scehduledDate.toLocaleString();//1.1

  if(dateTime){
    if(msInterval <= 0){
      alert('Please set valid date and time');
    }else{
      //check if previously set?
      chrome.storage.sync.get("alarms",(items)=>{
        var alarmsObj = items['alarms'];
        var alarmKeys = Object.keys(alarmsObj);
        const timeArray = [];
        var i = 0;
        const alarmValues = Object.values(alarmsObj);
        alarmValues.forEach( v =>{
          timeArray[i++] = v.time;
        });
        
        if(alarmKeys.findIndex((k)=>{return k == alarmName;}) == -1 && timeArray.findIndex((t)=>{return t == localeString;}) == -1){
          //if not set,
          // set in storage
          var alarm = {'time': localeString, 'period': period};
          alarmsObj[alarmName] = alarm;
          chrome.storage.sync.set({"alarms": alarmsObj});
          //send info to bg script
          chrome.runtime.sendMessage({
            'alarmName': alarmName ,
            'msInterval': msInterval,
            'period': period,
            'purpose': 'set'
          }, function (response) { 
           // console.log(response.status);
            alarmForm.reset();
            if(!isNaN(period)){
              const template = `<p class="alarm-item"><i class="far fa-bell"></i> <b>[${alarmName}] </b><i class="fa-light fa-right-long"></i> ${localeString} <br> <b class="period">Period: ${period} min</b> <button class="remove">remove</button></p>`;
              alarmTime.innerHTML += template;
            }else{
              const template = `<p class="alarm-item"><i class="far fa-bell"></i> <b>[${alarmName}] </b><i class="fa-light fa-right-long"></i> ${localeString} <br> <b class="period">Period: Once</b> <button class="remove">remove</button></p>`;
              alarmTime.innerHTML += template;
            }
          });
          // console.log('storage:');
          // console.log(items);//
        }else{
          alert("Can't set duplicate alarm\nPlease change the alarm name or time, other than set before ");
        }
      });
    }
  }else{
    alert('Please set valid date and time');
  }
});
//delete the alarms============================================================
alarmTime.addEventListener('click',(e)=>{
  if(e.target.classList.contains('remove')){
    //just hit trial to get the end of link icon
    const x = e.target.parentElement.children[1].textContent;//[name]
    //console.log(x.length);
    const alarmToRemove = x.substr(1, x.length-3).trim();
    //console.log(alarmToRemove);
    //send a msg to bg script to remove the alarm
    chrome.runtime.sendMessage({'name': alarmToRemove,'purpose': 'remove'},function(response){
      //console.log(response.status);
    });
    //remove from the object value of "alarms" key
    chrome.storage.sync.get('alarms',(items)=>{
        var alarmsValue = items['alarms'];//get the "alarms" value object
        //delete the key.value pair
        delete(alarmsValue[alarmToRemove]);
        //set object back again
        chrome.storage.sync.set( { 'alarms': alarmsValue });
        // console.log('storage:');
        // console.log(items);
    });

    // Also remove from page
    e.target.parentElement.remove();
  }
});
//listen message coming from bg script to remove the alarm having no 'periodInMinutes'
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {  
  if(request.purpose == 'removeOneTime'){
    //already removed from storage in bg.js
    loadAlarms();//just relode
  }
});

//timer management ===================================================================
const browsingTime = document.querySelector('#elapsedTime');
//first handshake with bg.js
setInterval(()=>{
  chrome.runtime.sendMessage({'popup': 'open'});
},1000);
//get the elapsed time
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
  if(request.purpose == 'spent'){
    var time = request.elapsedTime;
    var hour = Math.floor(time/3600);
    var r = time%3600;
    var minute = Math.floor(r/60);
    var second = r%60;
    if(hour<10) hour = '0'+hour;
    if(minute<10) minute = '0'+minute;
    if(second<10) second = '0'+second;
    browsingTime.innerHTML = `<b>Browsing Time: </b>${hour} : ${minute} : ${second}`;
  }
});

//break time management================================================
bdf.addEventListener('submit',(e)=>{
  e.preventDefault();
  var dur = (Math.floor(bdf.duration.value))*60;//seconds
  var now = new Date();
  if(dur >= 1){
    breakTime.innerHTML = `<p><i class="fas fa-coffee feature-btn"></i> Break after <b><big>${dur/60} minutes</big></b> from ${now.toLocaleTimeString()}<br><br><b class="warning"><i class="fas fa-exclamation-triangle"></i> </b><small>please do not disable the extension until break time is not reached. Please set again break duration ,if in case you had disabled extension before completion of above displayed break time.</small></p>`;
    chrome.storage.sync.set({'dur': {'time': dur/60,'now': now.toLocaleTimeString()}});
    chrome.runtime.sendMessage({'duration': dur, 'purpose': 'break'});
  }else{
    alert('Invalid duration entered\nPlease enter valid duration in minutes');
  }
  bdf.reset();
});

chrome.runtime.onMessage.addListener((request, sender,sendResponse)=>{
  if(request.purpose == 'breakover'){//break is over
    chrome.storage.sync.get('flags',(items)=>{
      var x = items['flags'];
      x['surfTime'] = false;//set surfTime to false which was earlier true
      chrome.storage.sync.set({'flags': x});
    });
    chrome.storage.sync.get('dur',(items)=>{//set duration time to default -1
      var d = items['dur'];
      d['time'] = -1;
      chrome.storage.sync.set({'dur': d});
    });
    breakTime.children[0].remove();//remove from the page
  }
});

