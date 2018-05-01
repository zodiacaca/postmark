
/*
  list
*/
// chrome.storage.local.clear();
chrome.storage.local.get(function (items) {
  console.log(items);
  var markList = document.getElementById("markList");
  for (var site in items) {
    var emptySite = true;
    
    for (var sub in items[site]) {
      var emptySubfolder = true;
      
      for (var entry in items[site][sub]) {
        
        if (!isNaN(entry)) {
          emptySite = false;
          emptySubfolder = false;
          var row = document.createElement("tr");
          row.id = site + "(" + entry + ")";
          var host = document.createElement("th");
          $(host).attr("scope", "row");
          var subfolder = document.createElement("td");
          var classes = document.createElement("td");
          var length = document.createElement("td");
          var title = document.createElement("td");
          var post = document.createElement("td");
          var postLink = document.createElement("a");
          var page = document.createElement("td");
          var pageLink = document.createElement("a");
          var seek = document.createElement("td");
          var date = document.createElement("td");
          var remove = document.createElement("td");
          var removeIcon = document.createElement("img");
          markList.appendChild(row);
          row.appendChild(host);
          row.appendChild(subfolder);
          row.appendChild(classes);
          row.appendChild(length);
          row.appendChild(title);
          row.appendChild(post);
          post.appendChild(postLink);
          row.appendChild(page);
          page.appendChild(pageLink);
          row.appendChild(seek);
          row.appendChild(date);
          row.appendChild(remove);
          remove.appendChild(removeIcon);
          host.appendChild(document.createTextNode(site));
          subfolder.appendChild(document.createTextNode(sub));
          classes.appendChild(document.createTextNode(items[site][sub][entry].class));
          length.appendChild(document.createTextNode(items[site][sub].maxEntries));
          title.appendChild(document.createTextNode(items[site][sub][entry].title));
          $(postLink).attr("href", items[site][sub][entry].href);
          $(pageLink).attr("href", items[site][sub][entry].page);
          postLink.appendChild(document.createTextNode("post"));
          pageLink.appendChild(document.createTextNode("page"));
          seek.appendChild(document.createTextNode("Seek"));
          date.appendChild(document.createTextNode(items[site][sub][entry].date));
          $(removeIcon).attr("src", "/icons/cross-remove-sign.svg");
          $(removeIcon).attr("alt", "remove");
          
          $(removeIcon).on("click", function () {
            var parent = $(this).parent().parent();
            var host = $(parent).children()[0].innerText;
            var subfolder = $(parent).children()[1].innerText;
            var id = parent[0].id.substring(host.length + 1, parent[0].id.length - 1);
            removeEntry(host, subfolder, id);
            $(parent).remove();
          });
        }
      }
      (emptySubfolder) && (removeEntry(site, sub));
    }
    (emptySite) && (removeEntry(site));
  }
});

function removeEntry(host, subfolder, id) {
  chrome.storage.local.get([host], function (item) {
    if (host && subfolder && id) {
      delete item[host][subfolder][id];
      chrome.storage.local.set(item);
      console.log("Delete entry for " + host + subfolder);
    } else if (host && subfolder) {
      delete item[host][subfolder];
      chrome.storage.local.set(item);
      console.log("Delete empty category for " + host);
    } else {
      chrome.storage.local.remove(host);
      console.log("Delete empty host " + host);
    }
  });
}


/*
  ui control
*/
function selectSection() {
  var innerWidth = document.body.clientWidth;
  $("#slider").css("transform", "translateX(" + (-innerWidth) + "px" + ")");
  $("#nav-marks").css("border-bottom", "thick solid rgba(0, 0, 0, 0.5)");
}
selectSection();

$("#nav-auto").on("click", function (e) {
  $("#slider").css("transform", "translateX(0)");
  $("#slider").css("transition", "all 600ms cubic-bezier(0.77, 0, 0.18, 1)");
  $(".nav-btn").css("border-bottom", "thick solid rgba(0, 0, 0, 0)");
  $(this).css("border-bottom", "thick solid rgba(0, 0, 0, 0.5)");
});
$("#nav-marks").on("click", function (e) {
  var innerWidth = document.body.clientWidth;
  $("#slider").css("transform", "translateX(" + (-innerWidth) + "px" + ")");
  $("#slider").css("transition", "all 600ms cubic-bezier(0.77, 0, 0.18, 1)");
  $(".nav-btn").css("border-bottom", "thick solid rgba(0, 0, 0, 0)");
  $(this).css("border-bottom", "thick solid rgba(0, 0, 0, 0.5)");
});
$("#nav-seek").on("click", function (e) {
  var innerWidth = document.body.clientWidth;
  $("#slider").css("transform", "translateX(" + (-innerWidth) * 2 + "px" + ")");
  $("#slider").css("transition", "all 600ms cubic-bezier(0.77, 0, 0.18, 1)");
  $(".nav-btn").css("border-bottom", "thick solid rgba(0, 0, 0, 0)");
  $(this).css("border-bottom", "thick solid rgba(0, 0, 0, 0.5)");
});

function adjustSectionSize() {
  var innerWidth = document.body.clientWidth;
  $("nav").css("width", innerWidth + "px");
  $(".crop").css("width", innerWidth + "px");
  $("#slider").children().css("width", innerWidth + "px");
  $("#slider-marks").css("left", innerWidth + "px");
  $("#slider-seek").css("left", innerWidth * 2 + "px");
  
  var innerHeight = window.innerHeight;
  $("body").css("height", innerHeight + "px");
  var navHeight = $("nav").height();
  var height = innerHeight - navHeight;
  $("#slider").children().css("height", height + "px");
}
adjustSectionSize();
