var serverURL = 'http://ff.willbeaufoy.net';
// var serverURL = 'http://127.0.0.1:8000';
var sendURL = serverURL + '/handle_selection/';
var ffUser = '';

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
  console.log('message received by select-listen.js');
  if(request.message == "selectListen") {
    console.log('message is selectListen')
    ffUser = request.ffUser;
    selectListen(request.sendPopupBehaviour);
  }
  if(request.message == 'stopListening') {
    console.log('message is stopListening. Removing event listeners')
    document.body.removeEventListener('click', closePopup);
    document.body.removeEventListener('mouseup', openPopup);
    closePopup();
  }
  if(request.message == 'updateFfUser') {
    console.log('updateFfUser called')
    console.log('ffUser was: ')
    console.log(ffUser);
    ffUser = request.ffUser;
    console.log('ffUser is now: ');
    console.log(ffUser);
  }
});

function closePopup(e) {
  var ffpopup = document.getElementById('ff_send_popup');
  if(ffpopup && e.target != ffpopup && !ffpopup.contains(e.target)) {
    ffpopup.parentNode.removeChild(ffpopup);
    ffpopup = null;
  }
}

function openPopup(e) {
  var selection = window.getSelection();
  var selectionText = selection.toString();
  console.log(selection);
  console.log(selectionText);
  // If there's a selection (i.e. if the user has actually highlighted something not just clicked), open a popup
  if(selectionText) {
    //self.port.emit('sendSelection', selectionText);
    console.log('There is selection text');

    var ff_send_popup = document.createElement('div');
    ff_send_popup.className = 'ff_send_popup';
    setTimeout(function() {
      ff_send_popup.id = 'ff_send_popup';
    }, 50);

    console.log(String(selection.anchorNode));
    var rect = getOffsetRect(selection.anchorNode.parentElement);
    ff_send_popup.style.top = rect.top + 'px';
    ff_send_popup.style.left = rect.left + 'px';

    var selection_text = document.createElement('span');
    selection_text.id = 'ff_send_selection_text';
    selection_text.className = 'ff_send_selection_text';
    selection_text.textContent = selectionText;

    var content_p = document.createElement('p');
    content_p.appendChild(document.createTextNode('Send the claim: '));
    content_p.appendChild(selection_text);
    content_p.appendChild(document.createTextNode(' to Full Fact?'));
    ff_send_popup.appendChild(content_p);

    var extra_info = document.createElement('textarea');
    extra_info.id = 'ff_send_extra_info';
    extra_info.className = 'ff_send_extra_info';
    extra_info.placeholder = 'Any extra info?';
    ff_send_popup.appendChild(extra_info);

    var tags = document.createElement('div');
    tags.className = 'ff_send_tags';

    var ffCategories = ['Economy', 'Health', 'Crime', 'Education', 'Immigration', 'Europe', 'Transport', 'Welfare and pensions', 'Energy and Environment', 'Other'];

    ffCategories.forEach(function(val, index, array) {
      var label = document.createElement('label');
      label.innerHTML = val + ' ';
      var tag = document.createElement('input');
      tag.type = 'checkbox';
      tag.name = val;
      tag.className = 'ff_tag_checkbox';
      label.appendChild(tag);
      tags.appendChild(label);
    });
    
    ff_send_popup.appendChild(tags);

    var send_button_wrapper = document.createElement('div');
    send_button_wrapper.className = 'ff_send_send_button_wrapper';
    var send_button = document.createElement('span');
    send_button.id = 'ff_send_send_button';
    send_button.className = 'ff_send_send_button';
    send_button.innerHTML = 'Send';

    send_button.addEventListener('click', sendData);

    send_button_wrapper.appendChild(send_button)
    ff_send_popup.appendChild(send_button_wrapper);

    var ff_logo = document.createElement('img');
    ff_logo.id = 'ff_logo';
    ff_logo.src = chrome.extension.getURL('icon-64.png');
    ff_send_popup.appendChild(ff_logo);

    document.body.appendChild(ff_send_popup);
  }

}

function sendData(e) {
  var tagNodes = document.querySelectorAll('.ff_tag_checkbox:checked');
  var tagsStr = '';
  for(var i = 0; i < tagNodes.length; i++) {
    tagsStr = tagsStr + tagNodes[i].name.toLowerCase().replace(/ /g, '-') + ' ';
  }
  // chrome.runtime.sendMessage('getFfUser');
  console.log(ffUser);
  var selection = document.getElementById('ff_send_selection_text');
  var extra_info = document.getElementById('ff_send_extra_info');

  var selectionContent = 'page=' + encodeURIComponent(document.URL) + '&selection=' + encodeURIComponent(selection.textContent) + '&extra_info=' + encodeURIComponent(extra_info.value) + '&tags=' + encodeURIComponent(tagsStr) + '&submitted_by=' + encodeURIComponent(ffUser);
  var xhr = new XMLHttpRequest();
  xhr.open("POST", sendURL, true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function() {
    console.log('xhr readystate has changed')
    if(xhr.readyState == 4) {
      console.log(xhr.responseText);
      var ffpopup = document.getElementById('ff_send_popup');
      var sendButton = document.getElementById('ff_send_send_button');
      sendButton.style.backgroundColor = '#86D174';
      sendButton.innerHTML = 'Selection sent';
      ffpopup.style.opacity = '0';
      ffpopup.style.transition = 'opacity 2s';
      setTimeout(function() {
        ffpopup.parentNode.removeChild(ffpopup);
        ffpopup = null;
      }, 2000)
    }
  }
  xhr.send(selectionContent);
}

function selectListen(sendPopupBehaviour) {

  console.log('selectListen called from select-listen.js');

  /* Set up the necessary CSS if it doesn't already exist in the page (i.e. from an earlier call to this function) */
  if(!document.getElementById('ff_style')) {
    var style = document.createElement('style');
    style.id = 'ff_style';
    var css = " \
      .ff_send_popup { position:absolute; z-index:999; max-width:320px; background-color:#86d174; padding:10px; border:1px solid #999; border-radius:5px; font-family: 'FS Me Web Bold', Helvetica, sans-serif; text-align: left } \
      .ff_send_popup p { font-size:16px; font-weight:normal; text-align:left; color:#333; white-space: normal; font-family: 'FS Me Web Bold', Helvetica, sans-serif } \
      .ff_send_selection_text { background-color:#fff; padding:0 4px } \
      textarea.ff_send_extra_info { width:310px; height:90px; margin: 10px 0} \
      .ff_send_submitted_by { width:140px } \
      .ff_send_popup label { font-size:16px; margin:10px; cursor: pointer} \
      .ff_send_popup label input[type='checkbox'] { vertical-align:middle } \
      div.ff_send_send_button_wrapper { margin:15px 0 10px 10px; float:left } \
      .ff_send_send_button { cursor:pointer; color:#fff; font-weight:bold; background-color:#ff7d01; border:1px solid #A2652B; border-radius:5px; padding:8px; font-size:16px } \
      img#ff_logo { float:right } \
    ";

    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  document.body.addEventListener('mouseup', openPopup);
  document.body.addEventListener('click', closePopup);
}
