

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
  if (e.target.tagName == "A") {
    linkData.item = e.target;
  } else {
    var parents = $(e.target).parents();
    var count = parents.length - 2;
    for (var i = 0; i < count; i++) {
      if (parents.get(i).tagName == "A") {
        linkData.item = parents.get(i);
        break
      }
    }
  }
  var title = $(linkData.item).attr("title");
  if (title && title.length > 0) {
    linkData.title = title;
  } else {
    linkData.title = e.target.innerText;
  }
  if (attributeValid(linkData.item, "href")) {
    linkData.href = $(linkData.item).attr("href");
    var question = linkData.href.indexOf("?");
    if (question > 0) {
      linkData.href = linkData.href.substring(0, question);
    }
  }
}


// variables //
var checkStatus = {
  checked: false,
  matched: false
}
var remembered = {
  selector: undefined,
  level: undefined,
  category: { category: undefined, depth: 0 },
  title: [],
  href: []
}
var matchedItem = [];

/*
  passive mark action
*/
// nah, only seem to response to elements added with different structure, not length change, so I write my own one
/* function registerObserver() {
  // Select the node that will be observed for mutations
  var targetNode = $("body")[0];

  // Options for the observer (which mutations to observe)
  var config = { childList: true };

  // Callback function to execute when mutations are observed
  var callback = function (mutationsList) {
    for (var mutation of mutationsList) {
      if (mutation.type == "childList") {
        lookupElements();
      }
    }
  };

  // Create an observer instance linked to the callback function
  var observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
} */
var lastContainerCount = 0;
function registerObserver() {
  if ($(remembered.selector).length > lastContainerCount) {
    lookupElements();
    lastContainerCount = $(remembered.selector).length;
  }
  setTimeout(function () {
    registerObserver();
  }, 500);
}

function checkMark()
{
  // initialize icon
  chrome.runtime.sendMessage({task: "icon", path: "icons/i-2.svg"});
  
  if (!checkStatus.checked) {
    lookupElements();
    registerObserver();
  }
  
  markItems();
}
checkMark();

function lookupElements() {
  chrome.storage.local.get([window.location.hostname], function (item) {
    for (var site in item) {
      for (var sub in item[site]) {
        if (window.location.href.indexOf(sub) >= 0) {
          findAutoSelectSubfolder(sub, site);
          for (var entry in item[site][sub]) {
            if (!isNaN(entry)) {
              var level = item[site][sub][entry].level;
              findAutoSelectLevel(level, site);
              var title = item[site][sub][entry].title;
              var href = item[site][sub][entry].href;
              var depth = item[site][sub][entry].depth;
              var tag = item[site][sub][entry].tag;
              var classes = item[site][sub][entry].class;
              var classSelector = getClassSelector(classes);
              remembered.selector = tag+classSelector;
              if (href && href.length) {
                $(tag+classSelector).each(function (index, value) {
                  if ($(value).parents().length == depth) {
                    $(value).attr("post", true); // don't check the checked element again
                    var match = false;
                    if (attributeValid(value, "href") && $(value).attr("href").indexOf(href) >= 0) {
                      match = true;
                      pushElements(value, value, undefined, href);
                    }
                    if (!match && $(value).attr("post") != true) {
                      $(value).find("a").each(function (i, v) {
                        if (attributeValid(v, "href") && $(v).attr("href").indexOf(href) >= 0) {
                          match = true;
                          pushElements(value, v, undefined, href);
                        }
                      });
                    }
                    (match) && (checkStatus.matched = true);
                  }
                });
              } else {
                $(tag+classSelector).each(function (index, value) {
                  if ($(value).parents().length == depth) {
                    $(value).attr("post", true);
                    var match = false;
                    if (value.innerText == title) {
                      match = true;
                      pushElements(value, value, title, undefined);
                    }
                    if (!match && $(value).attr("post") != true) {
                      $(value).find("a").each(function (i, v) {
                        if (v.innerText == title) {
                          match = true;
                          pushElements(value, v, title, undefined);
                        }
                      });
                    }
                    (match) && (checkStatus.matched = true);
                  }
                });
              }
            }
          }
        }
      }
      markItems();
      checkStatus.checked = true;
    }
  });
}

function pushElements(container, anchor, title, href) {
  var data = {
    container: container,
    anchor: anchor
  }
  matchedItem.pushIfUnique(data);
  if (title) {
    remembered.title.pushIfUnique(title);
  }
  if (href) {
    remembered.href.pushIfUnique(href);
  }
}

function markItems() {
  (checkStatus.matched) && (chrome.runtime.sendMessage({task: "icon", path: "icons/i-2-match.svg"}));
  matchedItem.forEach(function (item) {
    styleMark(item.container, "#48929B", "ff", false, false);
    // container, color, alpha, for displaying area, newly added
  });
}

function autoMark() {
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
    var autoItem = $(classSelector)[0];
    
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
      var outer = item[host][subfoldersStr][oldest].outer;
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
          nth: getNth(autoItem),
          title: title,
          outer: outer,
          page: page,
          date: getFullDate(),
          time: getTimeValue(),
          autoMarked: true
        }
        console.log(item);
        chrome.storage.local.set(item);
        styleMark(autoItem, { r:255, g:255, b:0, a:1 });
      }
    });
  }
}

function findAutoSelectLevel(level, host) {
  var url = window.location.href;
  if (url.indexOf(host) >= 0) {
    remembered.level = level;
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

// recheck size
document.getElementsByTagName("body")[0].onload = function() {
  $("body").find(".postmark-mark").each(function (index, value) {
    var parentSize = {
      w: value.parentElement.offsetWidth,
      h: value.parentElement.offsetHeight
    }
    $(value).css("width", parentSize.w + "px");
    $(value).css("height", parentSize.h + "px");
  });
}

