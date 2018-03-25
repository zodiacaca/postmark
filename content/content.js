
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.event == "onRClicked") {
    checkDOM();
  } else if (message.event == "onActivated") {
    mark()
  }
});

document.oncontextmenu = function (e) {
  item = e.target;
  link = $(item).attr("href");
  linkText = item.innerText;
}

// switch
var toggle = false;
var index = 0;

// link right clicked
var item;
var link;
var linkText;
var containers = [];
var lastContainer;
var lastContainerStyle;

// colors
var listTextColor = "rgba(30,30,30,1)"
var buttonTextColor = "rgba(230,230,230,1)"
var bgColor = "#fff";
var bgColorSelected = "#bbb";
var floorColor = "grey";
var stickColor = "#111";

var size = 16;
var zIndex;


function checkDOM()
{
  if (!document.getElementById("classBox") && item) {
    // chrome.runtime.sendMessage({ task: "css", file: "" });
    
    createBox();
    updateBox();
    addStick();
    findClasses()
    fillBox();
    addButtons();
    colorBackground();
    
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
    updateStyle();
    
    return !toggle;
  }
  
  // exit
  $("#classConfirm").on("click", function (e) {
    var markItem = {};
    var host = window.location.hostname;
    markItem[host] = {
      class: containers[index].class,
      href: link,
      title: linkText,
      page: window.location.href,
      date: getTime()
    };
    chrome.storage.local.set(markItem);
    console.log(markItem);
    $(containers[index].container).css("border", "thick solid #f00");
    $(containers[index].container).css("box-sizing", "border-box");
    $(containers[index].container).css("overflow", "hidden");
    clear();
  });
  
  $("#classCancel").on("click", function (e) {
    clear();
  });
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
  selectClasses()
}

function selectClasses() {
  chrome.storage.local.get(function(items) {
    var host = window.location.hostname;
    var markItem = items[host];
    if (markItem) {
      var classes = markItem.class;
      var containerClasses = [];
      var count = containers.length;
      for (var i = 0; i < count; i++) {
        containerClasses.push(containers[i].class)
      }
      var indexFound = containerClasses.findIndex(function (element) {
        return element == classes;
      });
      if (indexFound >= 0) {
        index = indexFound;
        updateStyle();
      }
    }
  });
}

/*
  make UI
*/
function createBox() {
  // initialize
  var classBox = document.createElement("div");
  classBox.id = "classBox";
  // append to body
  document.body.appendChild(classBox);
  // css properties
  $(classBox).css("all", "initial");
  $(classBox).css("border", "thin solid grey");
  $(classBox).css("border-left", "medium solid black");
  $(classBox).css("background-color", bgColor);
  $(classBox).css("box-sizing", "content-box");
  $(classBox).css("box-shadow", toPx([0.25, 0.25, 0]) + "#222");
  $(classBox).css("display", "block");
  $(classBox).css("position", "fixed");
  $(classBox).css("overflow", "hidden");
  
  // find top level
  var indexes = [];
  var nodes = $("body").children();
  nodes.each(function () {
    var z = $(this).css("z-index");
    (!isNaN(z)) && indexes.push(z);
  });
  if (indexes.length > 0) {
    var max = indexes.reduce(function (a, b) {
      return Math.max(a, b);
    });
    zIndex = max + 1;
    $(classBox).css("z-index", zIndex);
  }
}

function updateBox() {
  // update position of list box
  $("#classBox").position({
    my: "left top",
    at: "right top",
    of: item,
    collision: "fit"
  });
}

function addStick() {
  var stick = document.createElement("div");
  stick.id = "classStick";
  var classBox = document.getElementById("classBox");
  classBox.appendChild(stick);
  $(stick).css("all", "initial");
  $(stick).css("width", toPx(0.2));
  $(stick).css("height", toPx(0.9 * 2.2));
  $(stick).css("background-color", stickColor);
  $(stick).css("position", "absolute");
  $(stick).css("top", "0");
  $(stick).css("left", "0");
}

function fillBox() {
  createList();
  var count = containers.length;
  for (var i = 0; i < count; i++) {
    addItem(i);
  }
  updateStyle();
}

function createList() {
  // initialize
  var list = document.createElement("ol");
  list.id = "classList";
  // append
  var classBox = document.getElementById("classBox");
  classBox.appendChild(list);
  // css properties
  $(list).css("all", "initial");
  $(list).css("list-style", "none");
}

function addItem(i) {
  // initialize
  var level = document.createElement("li");
  var paragraph = document.createElement("p");
  // append
  var classList = document.getElementById("classList");
  classList.appendChild(level);
  level.appendChild(paragraph);
  paragraph.appendChild(document.createTextNode(containers[i].class));
  // css properties
  $(level).css("all", "initial");
  $(level).css("width", toPx(16));
  $(level).css("border-bottom", "thin solid " + floorColor);
  $(level).css("display", "block");
  
  $(paragraph).css("all", "initial");
  $(paragraph).css("font-family", "Helvetica");
  $(paragraph).css("font-size", toPx(0.9));
  $(paragraph).css("line-height", "2.2");
  $(paragraph).css("color", listTextColor);
  $(paragraph).css("margin-left", toPx(0.75));
  $(paragraph).before().css("content", "");
  $(paragraph).before().css("clear", "both");
  $(paragraph).before().css("display", "table");
}

function addButtons() {
  
  var classBox = document.getElementById("classBox");
  
  var width = 6;
  
  var cancel = document.createElement("button");
  cancel.id = "classCancel";
  document.body.appendChild(cancel);
  $(cancel).css("all", "initial");
  $(cancel).css("position", "fixed");
  $(cancel).css("z-index", zIndex);
  var removeIcon = document.createElement("img");
  var url = chrome.runtime.getURL("/icons/cross-remove-sign.svg");
  $(removeIcon).attr("src", url);
  cancel.appendChild(removeIcon);
  $(removeIcon).css("all", "initial");
  $(removeIcon).css("padding", toPx(0.4, 0.4));
  $(removeIcon).css("width", toPx(1));
  $(removeIcon).css("height", toPx(1));
  $(removeIcon).hover(
    function () {
      $(this).css("width", toPx(1.2));
      $(this).css("height", toPx(1.2));
    }, function () {
      $(this).css("width", toPx(1));
      $(this).css("height", toPx(1));
    }
  );
  $(cancel).position({
    my: "left top",
    at: "right top",
    of: classBox,
    collision: "fit"
  });
  
  var confirm = document.createElement("button");
  confirm.id = "classConfirm";
  classBox.appendChild(confirm);
  $(confirm).css("all", "initial");
  $(confirm).css("margin-top", toPx(1));
  $(confirm).css("position", "relative");
  $(confirm).css("float", "right");
  var checkIcon = document.createElement("img");
  url = chrome.runtime.getURL("/icons/check.svg");
  $(checkIcon).attr("src", url);
  confirm.appendChild(checkIcon);
  $(checkIcon).css("all", "initial");
  $(checkIcon).css("padding", toPx(0.5, 0.5));
  $(checkIcon).css("width", toPx(1.2));
  $(checkIcon).css("height", toPx(1.2));
  $(checkIcon).hover(
    function () {
      $(this).css("width", toPx(1.6));
      $(this).css("height", toPx(1.6));
      $(this).css("padding", toPx(0.3, 0.5, 0.5, 0.5));
    }, function () {
      $(this).css("width", toPx(1.2));
      $(this).css("height", toPx(1.2));
      $(this).css("padding", toPx(0.5, 0.5));
    }
  );
}

/*
  update UI
*/
function updateStyle() {
  // update stick position
  moveStick()
  // change item background color
  changeBackground()
  // color selected container background
  colorBackground();
}

function moveStick() {
  var listPos = $("#classList").position().top;
  var itemPos = $("#classList").children().eq(index).position().top;
  var top = itemPos - listPos;
  $("#classStick").css("top", top);
}

function changeBackground() {
  $("#classList").children().css("background-color", bgColor);
  $("#classList").children().eq(index).css("background-color", bgColorSelected);
}

function colorBackground() {
  lastContainer && $(lastContainer).css("background", lastContainerStyle);
  var bg = $(containers[index].container).css("background");
  var bgIndex = bg.indexOf(")");
  var bgStyle = bg.substr(bgIndex + 1);
  $(containers[index].container).css("background", "rgba(0,0,255,0.2)" + bgStyle);
  lastContainer = containers[index].container;
  lastContainerStyle = bg;
}

/*
  toPx
*/
function toPx(num) {
  var array = Array.isArray(num);
  if (array) {
    var count = num.length;
    var str = "";
    for (var i = 0; i < count; i++) {
      str += num[i] * 16 + "px ";
    }
    
    return str;
  } else {
    return num * 16 + "px";
  }
}

/*
  reset
*/
function clear() {
  lastContainer && $(lastContainer).css("background", lastContainerStyle);
  $("#classBox").remove();
  $("#classCancel").remove();
  item = undefined;
  link = undefined;
  linkText = undefined;
  containers = [];
  lastContainer = undefined;
  lastContainerStyle = undefined;
  index = 0;
  toggle = false;
}
