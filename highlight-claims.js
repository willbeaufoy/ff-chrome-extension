var serverURL = 'http://ff.willbeaufoy.net';
// var serverURL = 'http://127.0.0.1:8000';
var searchURL = serverURL + '/search_facts/';

function getOffsetRect(elem) {
  // (1)
  var box = elem.getBoundingClientRect()
  
  var body = document.body
  var docElem = document.documentElement
  
  // (2)
  var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
  var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
  
  // (3)
  var clientTop = docElem.clientTop || body.clientTop || 0
  var clientLeft = docElem.clientLeft || body.clientLeft || 0
  
  // (4)
  var top  = box.top +  scrollTop - clientTop
  var left = box.left + scrollLeft - clientLeft
  
  return { top: Math.round(top), left: Math.round(left) }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('message received by highlight-claims.js');
  if(request.message == "highlightClaims") {
    console.log('message is highlightClaims');
    //var pageContent = {'content': document.body.innerHTML};
    var pageContent = 'content=' + encodeURIComponent(document.body.innerHTML);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", searchURL, true);
    // xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
      console.log('xhr readystate has changed')
      if(xhr.readyState == 4) {
        console.log('xhr readystate is 4')
        var resp = JSON.parse(xhr.responseText);
        console.log(resp);
        updatePage(resp);
      }
    }
    // console.log(pageContent);
    // console.log(JSON.stringify(pageContent));
    xhr.send(pageContent);
  }
});

function updatePage(changes) {
  console.log('updatePage called');

  /* Add style information to document for highlighted claims and popups */

  var style = document.createElement('style');
  var css = ".ff_highlight_claim { background-color: yellow } \
  .ff_highlight_popup { display:none; position:absolute; top:-20px; z-index:999; max-width:500px; background-color:#eee; padding:10px; border:1px solid #999; border-radius:5px;} \
  .pbpopop a, .ff_highlight_popup a:visited, .ff_highlight_popup a:link { color:#1a0dab; } \
  .ff_highlight_popup p {font-size:14px; font-weight:normal; text-align:left; color:#333; white-space: normal; font-family: 'Open-sans', sans-serif;}";

  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  /* For each found article claim, add a popup to be shown when it is hovered over, and construct the necessary variables for the tree walk search and replace */

  var claims = {};
  var claimsRegex = '\\b';

  for(change in changes) {
    var changeId = change;
    var claim = changes[change];
    // var link = changes[change].link;
    // var excerpt = changes[change].excerpt;
    // var word_count = changes[change].word_count;

    // console.log('make change')
    // console.log(claim)
    // console.log(link)
    // console.log(excerpt)
    // console.log(word_count)
    // console.log("\n")

    /* Create the popup div (hidden by default) and append it to the body */

    var popup = document.createElement('div');
    popup.id = 'ff_highlight_popup' + changeId;
    popup.className = 'ff_highlight_popup';

    var link_p = document.createElement('p');
    var link_a = document.createElement('a');
    link_a.href = '';
    link_a.target = '_blank';
    link_a.innerHTML = claim;
    link_p.appendChild(link_a);
    popup.appendChild(link_p);

    // var excerpt_p = document.createElement('p');
    // excerpt_p.innerHTML = excerpt;
    // popup.appendChild(excerpt_p);

    // var word_count_p = document.createElement('p');
    // word_count_p.innerHTML = word_count + ' words';
    // popup.appendChild(word_count_p);

    document.body.appendChild(popup);

    popup.addEventListener('mouseleave', function(e) {
      //console.log('mouseleave popup');
      //console.log(popup);
      //console.log(e);
      //console.log(e.target);
      e.target.style.display = 'none';
    });

    claims[claim] = change;
    claimsRegex += '(' + claim + ')|';

    // console.log("findclaims finished. Moving to next change\n");
  }

  //console.log(walker);
  var node;
  var matchedNodes = [];
  claimsRegex = '\\b' + claimsRegex.slice(0, - 1) + '\\b';

  var pattern = new RegExp(claimsRegex, 'g');

  /* Walk the DOM tree inserting highlight spans where claims are found */

  var walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    //   { acceptNode: function(node) {
    //     // Logic to determine whether to accept, reject or skip node
    //     if (node.nodeValue && node.parentElement.offsetWidth != 0 && pattern.test(node.nodeValue)) {
    //       return NodeFilter.FILTER_ACCEPT;
    //     }
    //   }
    // },
    null,
    false
  );

  

  function findClaims() {
    for(var i = 0; i < 1000; i++) {
      if(!(node = walker.nextNode())) {
        matchedNodes.forEach(highlightMatch);
        return;
      }
      if(node.nodeValue && node.parentElement.offsetWidth != 0 && pattern.test(node.nodeValue)) {
        console.log('node matches');
        var matchedNode = {};
        matchedNode['node'] = node;
        var matches = node.nodeValue.match(pattern);
        matchedNode['matches'] = matches;
        matchedNodes.push(matchedNode);
      }
    }
    console.log('For loop done')
    setTimeout(findClaims, 0);
  }

  findClaims();

  /* For each found textnode replace it with an element containing the original text with the claim keyword highlighted */

  function highlightMatch(matchedNode, index, array) {
    var newSpan = document.createElement('span');
    // But what if it occurs multi times?
    // var nodeText = matchedNode['node'].nodeValue.toString();
    // console.log('nodeText:');
    // console.log(nodeText);
    // console.log(typeof nodeText);
    var remainingText = matchedNode['node'].nodeValue;
    for(var i = 0; i < matchedNode['matches'].length; i++) {
      // Assume matchedNode['matches'] is in order they occur in string
      var match = matchedNode['matches'][i];
      var splitVal = [remainingText.split(match)[0], remainingText.split(match).slice(1).join(match)];
      console.log(splitVal);
      var before = '';
      var after = '';
      if(splitVal[0]) before = splitVal[0];
      if(splitVal[1]) after = splitVal[1];
      var highlight = document.createElement('span');
      highlight.id = 'ff_highlight_claim' + claims[match];
      highlight.className = 'ff_highlight_claim';
      highlight.textContent = match;
      highlight.addEventListener('mouseenter', function(e) {
        // console.log(highlight);
        // console.log(e.target);
        var rect = getOffsetRect(e.target);
        // console.log('highlighted coords: ' + rect.top + ', ' + rect.left);
        // console.log(e);
        // console.log(e.clientY);
        // console.log(e.clientX);
        var popup = document.getElementById('ff_highlight_popup' + e.target.id.replace('ff_highlight_claim', ''));
        popup.style.position = 'absolute';
        // popup.style.top = e.clientY + 'px';
        // popup.style.left = e.clientX + 'px';
        popup.style.top = rect.top + 'px';
        popup.style.left = rect.left + 'px';
        popup.style.display = 'block';
      });
      // console.log('tnBefore:');
      // console.log(tnBefore);
      // console.log('highlight:');
      // console.log(highlight);
      // console.log('tnAfter:');
      // console.log(tnAfter);
      if(before) {
        newSpan.appendChild(document.createTextNode(before));
      }
      newSpan.appendChild(highlight);
      remainingText = after;
      // console.log(remainingText);
      // console.log('remainingText');
    }

    // After node has been checked add the last bit

    if(remainingText) newSpan.appendChild(document.createTextNode(remainingText))

    matchedNode['node'].parentNode.replaceChild(newSpan, matchedNode['node']);
  }
}