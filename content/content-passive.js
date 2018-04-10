
// prototype
Array.prototype.pushIfUnique = function(element) { 
  if (this.indexOf(element) == -1) {
    this.push(element);
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.event == "onRClicked") {
    checkDOM();
  } else if (message.event == "onActivated") {
    checkMark();
  } else if (message.event == "onIconClicked") {
    jump();
  }
});


document.oncontextmenu = function (e) {
  item = e.target;
  link = $(item).attr("href");
  linkText = item.innerText;
}


/*
  passive mark action
*/
function checkMark()
{
/*   $.ajax({
    url: "",
    dataType: "html",
    success: extractBody
  });
  
  function extractBody(html)
  {
    var start = html.indexOf("<body");
    var newStart = html.indexOf(">", start)
    newStart += 1;
    var end = html.indexOf("</body>");
    var body = html.substring(newStart, end+7);
    body = "<body>" + body;
    phaseXML(body);
    console.log(body);
  }
  
  function phaseXML(body)
  {
    var xmlDoc = $.parseXML(body);
    findLink(xmlDoc);
  }
  
  function findLink(xml)
  {
    var container = $(xml).find("");
    console.log(container);
  } */
  
  // initialize icon
  chrome.runtime.sendMessage({task: "icon", path: "icons/postmark.svg"});
  
  chrome.storage.local.get([window.location.hostname], function (item) {
    if (item) {
      for (var site in item) {
        for (var sub in item[site]) {
          findAutoSelectSubfolder(sub, site);
          for (var entry in item[site][sub]) {
            if (!isNaN(entry)) {
              var title = item[site][sub][entry].title;
              var classes = item[site][sub][entry].class;
              findAutoSelectClass(classes, site);
              var classSelector = getClassSelector(classes);
              var matched = false;
              if (title && title != "") {
                $(classSelector).each(function (index, value) {
                  var match = false;
                  ($(value).innerText == title) && (match = true);
                  $(value).find("a").each(function (i, v) {
                    if (v.innerText == title) {
                      match = true;
                      matchedItem.push(value);
                      remembered.title.push(title);
                    }
                  });
                  (match) && ($(value).css("border", "thick solid #f00"));
                  (match) && ($(value).css("box-sizing", "border-box"));
                  (match) && ($(value).css("overflow", "hidden"));
                  (match) && (matched = true);
                });
              } else {
                $(classSelector).each(function (index, value) {
                  var match = false;
                  ($(value).attr("href") == item[site][sub][entry].href) && (match = true);
                  $(value).find("a").each(function (i, v) {
                    if ($(v).attr("href") == item[site][sub][entry].href) {
                      match = true;
                      matchedItem.push(value);
                      remembered.link.push(item[site][sub][entry].href);
                    }
                  });
                  (match) && ($(value).css("border", "thick solid #f00"));
                  (match) && ($(value).css("box-sizing", "border-box"));
                  (match) && ($(value).css("overflow", "hidden"));
                  (match) && (matched = true);
                });
              }
              // change icon to notice user
              (matched) && (chrome.runtime.sendMessage({task: "icon", path: "icons/postmark-r.svg"}));
            }
          }
        }
      }
    }
    autoMark();
  });
}
checkMark();

function autoMark()
{
  var host = window.location.hostname;
  var page = window.location.href;
  var home = false;
  if (page.lastIndexOf("/") + 1 == page.length) {
    home = isNaN(page.substr(page.lastIndexOf("/") - 1, 1))
  } else {
    home = isNaN(page.substr(page.length - 1, 1))
  }
  
  if (remembered.category.category && remembered.class && home) {
    var classSelector = getClassSelector(remembered.class);
    autoItem = $(classSelector)[0];
    
    chrome.storage.local.get([host], function (item) {
      var subfoldersStr = remembered.category.category;
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
      var href;
      var title;
      var indexHREF = -1;
      var indexTitle = -1;
      $(autoItem).find("a").each(function (i, v) {
        if (v.innerText) {
          href = $(v).attr("href");
          title = v.innerText;
          if (indexHREF == -1) {
            indexHREF = remembered.link.findIndex(function (element) {
              return element == $(v).attr("href");
            });
          }
          if (indexTitle == -1) {
            indexTitle = remembered.title.findIndex(function (element) {
              return element == v.innerText;
            });
          }
        }
      });
      if (indexHREF = -1 && indexTitle == -1) {
        item[host][subfoldersStr][number] = {
          class: remembered.class,
          href: href,
          title: title,
          page: page,
          date: getTime()
        }
        console.log(item);
        chrome.storage.local.set(item);
        styleContainer(autoItem, "orange");
      }
    });
  }
}

function findAutoSelectClass(classes, host) {
  var url = window.location.href;
  if (url.indexOf(host) >= 0) {
    remembered.class = classes;
  }
}

function findAutoSelectSubfolder(subfolder, host) {
  var url = window.location.href;
  if (url.indexOf(host) >= 0 && url.indexOf(subfolder) >= 0) {
    if (subfolder.length > remembered.category.depth) {
      remembered.category.category = subfolder;
      remembered.category.depth = subfolder.length;
    }
  }
}

function getClassSelector(classes) {
  var classArray;
  if (classes.indexOf(" ") >= 0) {
    classArray = classes.split(" ");
    for (var i = 0; i < classArray.length; i++) {
      classArray[i] = "." + classArray[i];
    }
  } else {
    classArray = ["." + classes];
  }
  var classSelector = "";
  for (var i = 0; i < classArray.length; i++) {
    classSelector += classArray[i];
  }
  
  return classSelector;
}

