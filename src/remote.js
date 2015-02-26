(function(){
  var appsLink = document.createElement('a');
  appsLink.innerHTML = "Try Mirobot Apps!";
  appsLink.href = "http://apps.mirobot.io/#m=" + window.location.hostname
  var s = appsLink.style;
  s.background = '#33D121';
  s.border = 'none';
  s.color = '#FFF';
  s['font-size'] = '120%';
  s['text-decoration'] = 'none';
  s.position = 'absolute';
  s.left = '50%';
  s.top = '20px';
  s.display = 'block';
  s.padding = '10px';
  s['font-weight'] = 'bold';
  document.getElementById('header').appendChild(appsLink);
  var w = appsLink.getBoundingClientRect().width/2;
  s.margin = '0 0 0 -' + w + 'px';
})()