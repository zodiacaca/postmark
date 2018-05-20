
// variables //
var checkedStatus = 0;  // 0 not checked; 10 checked and none; 11 checked and hit

// switch
var toggle = false;
var jumpToggle = 0;
var index = 0;

// link right clicked
var item;
var autoItem;
var link;
var linkText;
var textOuterTag;
var containers = [];
var lastContainer;
var lastContainerStyle;
var subfolders = [];
var remembered = {
  class: undefined,
  category: { category: undefined, depth: 0 },
  link: [],
  title: []
}

// colors
var listTextColor = "rgba(30,30,30,1)"
var bgColor = "#fff";
var bgColorSelected = "#bbb";
var floorColor = "grey";
var stickColor = "#111";

var size = 16;
var zIndex;


function checkDOM()
{
  // popup box
  if (!document.getElementById("markBox") && item) {
    // chrome.runtime.sendMessage({ task: "css", file: "" });
    
    createBox();
    updateBox();
    addStick();
    findClasses()
    fillBox();
    addButtons();
    colorBackground();
    
    selectClasses();
    toggle = true;
  }
  else {
    clear();
    
    toggle = false;
  }
  
  // use wheel for selecting class
  window.onwheel = function (e) {
    if (e.deltaY < 0) {
      if (index > 0) { index -= 1 }
    }
    if (e.deltaY > 0) {
      if (index < containers.length - 1) { index += 1 }
    }
    (document.getElementById("markBox")) && (updateStyle());
    
    return !toggle;
  }
  
  // exit
  $("#markConfirm").on("click", function (e) {
    prepareData();
  });
  
  $("#markCancel").on("click", function (e) {
    if (document.getElementById("markFolders")) {
      $("#markFolders").remove();
      subfolders = [];
    } else {
      clear();
    }
  });
}

/*
  save data
*/
function prepareData() {
  var host = window.location.hostname;
  var page = window.location.href;
  if (!document.getElementById("markFolders")) {
    var subfoldersStr = page.substr(page.indexOf(host) + host.length);
    if (subfoldersStr.indexOf("/") + 1 != subfoldersStr.length) {
      var slashIndexes = [];
      var pos = 0;
      while (subfoldersStr.indexOf("/", pos) >= 0) {
        slashIndexes.pushIfUnique(subfoldersStr.indexOf("/", pos));
        pos += 1;
      }
      var subArray = [];
      for (var i = 0; i < slashIndexes.length; i++) {
        var a = slashIndexes[i] + 1;
        var b = slashIndexes[i + 1];
        b ? b++ : b = undefined;
        (a < subfoldersStr.length) && (subArray.push(subfoldersStr.substring(a, b)));
      }
      addFolderList();
      for (var i = 0; i < subArray.length; i++) {
        showSubfolders(i + 1, subArray[i]);
      }
    }
  }
  if (!document.getElementById("markFolders") || subfolders.length > 0) {
    saveData(host, page, containers[index], link, linkText, textOuterTag);  // pass variables to local ones, storageArea has a delay
    clear();
  }
  if (document.getElementById("markFolders")) {
    subfolders.push(window.location.hostname + "/");
    if (remembered.category.category) {
      for (var i = 1; i <= $("." + "folderButton").length; i++) {
        var depth = "";
        for (var ii = 0; ii < i; ii++) {
          depth += $("." + "folderButton")[ii].innerText;
        }
        selectButton(depth, i);
      }
    }
  }
}

function saveData(host, page, container, link, linkText, tag) {
  var subfoldersStr = "";
  for (var i = 1; i < subfolders.length; i++) {
    subfoldersStr += subfolders[i];
  }
  subfoldersStr = "/" + subfoldersStr;
  chrome.storage.local.get([window.location.hostname], function (item) {
    (!item[host]) && (item[host] = {});
    (!item[host][subfoldersStr]) && (item[host][subfoldersStr] = {});
    (!item[host][subfoldersStr]["maxEntries"]) && (item[host][subfoldersStr]["maxEntries"] = 2);
    var oldest;
    var length = 0;
    for (var key in item[host][subfoldersStr]) {
      (!oldest) && (oldest = key);
      length += 1;
    }
    length -= 1;
    (isNaN(oldest)) && (oldest = 1);
    if (length >= item[host][subfoldersStr]["maxEntries"]) {
      delete item[host][subfoldersStr][oldest];
    }
    var number = parseInt(oldest) + length;
    item[host][subfoldersStr][number] = {
      class: container.class,
      href: link,
      nth: getNth(container.container),
      title: linkText,
      outer: tag,
      page: page,
      date: getFullDate(),
      time: getTimeValue(),
      autoMarked: false
    }
    console.log(item);
    chrome.storage.local.set(item);
    styleMark(container.container, "red");
    matchedItem.pushIfUnique(container.container);
  });
}

function getNth(ctn) {
  var num = 0;
  $(ctn).find("a").each(function (i, v) {
    num++;
  });
  
  return num;
}

function getFullDate() {
  var d = new Date();
  var year = d.getFullYear();
  var month = d.getMonth() + 1;
  var date = d.getDate();
  var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var day = days[d.getDay()];
  
  var str = year + "/" + month + "/" + date + ", " + day;
  
  return str;
}

function getTimeValue() {
  var d = new Date();
  
  return d.getTime();
}

function styleMark(ctn, color) {
  if (!$(ctn).children(".postmark-marks").length) {
    var containerSize = {
      w: ctn.offsetWidth,
      h: ctn.offsetHeight
    }
    if ($(ctn).css("position") == "static") {
      $(ctn).css("position", "relative");
    }
    var mark = document.createElement("div");
    mark.className = "postmark-marks";
    ctn.appendChild(mark);
    $(mark).css("all", "initial");
    $(mark).css("width", containerSize.w + "px");
    $(mark).css("height", containerSize.h + "px");
    $(mark).css("border", "medium solid " + color);
    $(mark).css("box-sizing", "border-box");
    $(mark).css("position", "absolute");
    $(mark).css("top", 0);
    $(mark).css("left", 0);
    $(mark).css("pointer-events", "none");
  }
}

/*
  find classes
*/
function findClasses() {
  var itemClass = item.className;
  if (itemClass) {
    var data = {
      container: undefined,
      class: undefined
    }
    data.container = $(item);
    data.class = itemClass;
    
    containers.push(data);
  }
  
  var parents = $(item).parents();
  var count = parents.length - 2;
  for (var i = 0; i < count; i++) {
    var classNames = parents.get(i).className;
    if (classNames) {
      var data = {
        container: undefined,
        class: undefined
      }
      data.container = parents.get(i);
      data.class = classNames;
      
      containers.push(data);
    }
  }
}

function selectClasses() {
  var containerClasses = [];
  var count = containers.length;
  for (var i = 0; i < count; i++) {
    containerClasses.push(containers[i].class);
  }
  var indexFound = containerClasses.findIndex(function (element) {
    return element == remembered.class;
  });
  if (indexFound >= 0) {
    index = indexFound;
    updateStyle();
  }
}

/*
  jump
*/
function jump() {
  if (matchedItem.length > 0) {
    if (jumpToggle == matchedItem.length) {
      window.scrollTo(0, 0);
      console.log("Jump to TOP");
    } else {
      var item = matchedItem[matchedItem.length - jumpToggle - 1];
      window.scrollTo(0, $(item).offset().top);
      console.log("Jump to " + item);
    }
    if (jumpToggle < matchedItem.length) {
      jumpToggle++;
    } else {
      jumpToggle = 0;
    }
  }
}

/*
  reset
*/
function clear() {
  (lastContainer) && ($(lastContainer).css("background", lastContainerStyle));
  $("#markBox").remove();
  $("#opBox").remove();
  item = undefined;
  link = undefined;
  linkText = undefined;
  textOuterTag = undefined;
  containers = [];
  lastContainer = undefined;
  lastContainerStyle = undefined;
  subfolders = [];
  index = 0;
  jumpToggle = 0;
  toggle = false;
}

