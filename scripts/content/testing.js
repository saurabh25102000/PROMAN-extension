// //set 1 value at a time
// chrome.storage.sync.set({"num1": 10 }, () => {
//     console.log('set success');
// });
// chrome.storage.sync.set({"num2": 20 }, () => {
//     console.log('set success');
// });
// chrome.storage.sync.set({"num3": 30 }, () => {
//     console.log('set success');
// });
// chrome.storage.sync.set({"num4": 40 }, () => {
//     console.log('set success');
// });
// //set multiple key/value pairs at a time
// chrome.storage.sync.set({
//     "num5": 50,
//     "num6": 60,
//     "num7": 70,
//     "num8": 80
// },()=>{
//     console.log('set success 2nd time');
// });
// //get 1 value
// chrome.storage.sync.get("num2",(item)=>{
//     console.log(item);
//     console.log(item.num2);
// });
// //get multiple values
// chrome.storage.sync.get(["num1","num2","num4"],(item)=>{
//     console.log(item);
//     console.log(item.num1,item.num2,item.num4);
// });
// //get all values
// chrome.storage.sync.get(null,(item)=>{
//     console.log(item);
//     console.log(item.num1);
//     console.log(item.num1,item.num2);
//     console.log(item.num1,item.num2,item.num3);
//     console.log(item.num1,item.num2,item.num3,item.num4);
//     console.log(item.num1,item.num2,item.num3,item.num4,item.num5);
//     console.log(item.num1,item.num2,item.num3,item.num4,item.num5,item.num6);
//     console.log(item.num1,item.num2,item.num3,item.num4,item.num5,item.num6,item.num7);
//     console.log(item.num1,item.num2,item.num3,item.num4,item.num5,item.num6,item.num7,item.num8);
// });

// //set the whole array in chrome.storage
// const nameList = ['Saurabh','Shrikant','Vivek','Reena','Ayush'];
// chrome.storage.sync.set({"namelist": nameList},()=>{
//     console.log('list set success');
// });
// //get all values
// chrome.storage.sync.get(null,(item)=>{
//     console.log(item);
//     console.log(item.namelist);
// });

// //set an object of multiple key/value pairs
// const storageArray = {};//create an empty object
// var key1 = "name1", key2 = "name2", key3 = "name3";
// storageArray[key1] = "Saurabh";
// storageArray[key2] = "Shrikant";
// storageArray[key3] = "Vivek";

// chrome.storage.sync.set({"names": storageArray}, function () { //set the obj in storage under "names" key
//     console.log('set success');
// });
// //get the items
// chrome.storage.sync.get(null, (item) => {
//     console.log(item);
//     console.log(item.names);
// });
// // //Removes all items from storage.
// // chrome.storage.sync.clear( () => { 
// //     console.log('storage cleared');
// // });
// // //After clear get storage empty
// // chrome.storage.sync.get(null, (item) => {
// //     console.log(item);
// // });
// //Gets the amount of space (in bytes) being used by one or more items.
// //space used by 1 item
// chrome.storage.sync.getBytesInUse("names", (bytesinuse) => {
//     console.log(bytesinuse);
// });
// //space used by whole items
// chrome.storage.sync.getBytesInUse(null, (bytesinuse) => {
//     console.log(bytesinuse);
// });
// // Removes one or more items from storage.
// chrome.storage.sync.remove(["names","num4","num5"], () => {
//     console.log('remove success');
// });
// //After remove check by getting
// chrome.storage.sync.get(null, (item) => {
//     console.log(item);
// });

// chrome.storage.onChanged.addListener((changes,areaName)=>{
//     for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
//         console.log(
//           `Storage key "${key}" in namespace "${areaName}" changed.`,
//           `Old value was "${oldValue}", new value is "${newValue}".`
//         );
//       }
// });

// chrome.storage.sync.set({"num1": 100});//change detected in num1, old is 10, new is 100

// chrome.storage.sync.clear(()=>{
//     console.log('cleared');
// });