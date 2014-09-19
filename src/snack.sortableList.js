snack.wrap.define('draggableList', function(config){
  var clickTimeout;
  var dragging = false;
  var dragEl;
  var movers;
  var body = snack.wrap('body');
  var offset;
  var placeholder;
  
  var setPos = function(el, x, y){
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
  
  // Works out if a point is within an element
  var intersect = function(x, y, element){
    return x > element.offsetLeft &&
    x < element.offsetLeft + element.offsetWidth &&
    y > element.offsetTop &&
    x < element.offsetTop + element.offsetHeight
  }
  
  var movePlaceholder = function(event){
    // Create the placeholder if it doesn't exist already
    if(!placeholder){ 
      var div = document.createElement('div');
      div.innerHTML = config.placeholder;
      placeholder = div.childNodes[0];
    }
    
    var target = snack.wrap(config.target)[0];
    // If we're over the drop area, work out where to put the placeholder
    if(intersect(dragEl.offsetLeft + dragEl.offsetWidth/2, dragEl.offsetTop + dragEl.offsetHeight/2, target)){
      // find the li that's nearest to the cursor and insert placeholder bofore it
      var targets = Array.prototype.slice.call( target.getElementsByTagName('li'), 0 ).filter(function(el){ return el !== dragEl; });
      // calculate vertical distances
      var dists = targets.map(function(t){
        return [t, Math.abs((dragEl.offsetTop + dragEl.offsetHeight/2)- t.offsetTop)];
      });
      // find the nearest
      var nearest = dists.reduce(function(prev, curr){
        return (prev[1] < curr[1] ? prev : curr);
      });
      // insert placeholder before
      nearest[0].parentNode.insertBefore(placeholder, nearest[0]);
    }else{
      if(placeholder){
        snack.wrap(placeholder).remove();
      }
    }
  }
  
  var startDrag = function(element, event){
    // Set the currently selected elements as default, otherwise when copied the settings reset
    snack.each(element.getElementsByTagName('option'), function(el){
      el.value === el.parentNode.value ? el.setAttribute("selected", "selected") : el.removeAttribute("selected");
    });
    // Either use or copy the node
    dragEl = (config.copy ? element.cloneNode(true) : element)
    // Store the offset of the mouse from top left
    offset = {
      x: event.pageX - element.offsetLeft,
      y: event.pageY - element.offsetTop
    }
    // Style it so it looks the same (padding and border currently hardcoded)
    dragEl.style.width = element.offsetWidth - 22 + 'px';
    dragEl.style.height = element.offsetHeight - 22 + 'px';
    dragEl.style.display = 'block';
    dragEl.style.position = 'absolute';
    snack.wrap(dragEl).addClass('dragged');
    snack.wrap('body').addClass('dragging');
    setPos(dragEl, event.pageX - offset.x, event.pageY - offset.y);
    element.parentElement.appendChild(dragEl);
    movePlaceholder(event);
    dragging = true;
  }
  
  // Called on move to update the position and the placeholder
  var drag = function(event){
    if(!dragging){ return; }
    setPos(dragEl, event.pageX - offset.x, event.pageY - offset.y);
    movePlaceholder(event);
  }
  
  // Drop it in place
  var stopDrag = function(event){
    if(movers){
      movers.detach('movers');
      movers = undefined;
    }
    dragging = false;
    snack.wrap('body').removeClass('dragging');
    snack.wrap(dragEl).removeClass('dragged');
    dragEl.parentNode.removeChild( dragEl );
    if(placeholder.parentNode){
      placeholder.parentNode.insertBefore(dragEl, placeholder);
      if(!dragEl._draggable){
        snack.wrap(dragEl).draggableList({
          target: config.target,
          placeholder: '<li class="placeholder"/>',
          copy: false
        });
      }
    }
    
    dragEl.style.width = ''
    dragEl.style.height = '';
    dragEl.style.display = '';
    dragEl.style.position = '';
    
    snack.wrap(placeholder).remove();
  }
  
  // Monolithic event handler for all of the events
  var eventHandler = function(event, element){
    var elType = (event.target || event.srcElement).nodeName.toLowerCase();
    if(elType !== 'select' && elType !== 'input'){
      if(event.type === 'mousedown'){
        // start listening to move and up
        movers = addEventHandlers(['mouseup', 'mousemove'], body, 'movers');
        // start dragging
        startDrag(element, event);
      }else if(event.type === 'touchstart'){
        // Add a small delay to differentiate from page scroll
        clickTimeout = window.setTimeout(function(){
          startDrag(element, event);
        }, 100);
        // start listening to move and end
        movers = addEventHandlers(['touchend', 'touchmove'], body, 'movers');
      }else if(event.type === 'touchend' || event.type === 'mouseup'){
        // Clear the timeout if we've released before it triggered
        if(clickTimeout){
          clearTimeout(clickTimeout);
        }
        // Stop dragging
        stopDrag(event);
      }else if(event.type === 'touchmove' || event.type === 'mousemove'){
        // Clear the timeout if we've moved before it triggered
        if(clickTimeout){
          clearTimeout(clickTimeout);
        }
        // Stop dragging
        drag(event);
      }
    }
    event.stopPropagation();
    event.preventDefault();
  }
  
  // Attach handlers
  var addEventHandlers = function(events, element, ns){
    var el = snack.wrap(element);
    var res_el;
    ns = (ns ? '.' + ns : '');
    snack.each(events, function(ev){
      res_el = el.attach(ev + ns, function(event){eventHandler(event, element)});
      if(ev === 'mousedown' || ev === 'touchstart'){
        // Stop event propagation on form elements
        snack.each(['select', 'input'], function(tag){
          var tags = element.getElementsByTagName(tag);
          for(var i = 0; i< tags.length; i++){
            tags[i].addEventListener(ev, function(e){e.stopPropagation();});
          }
        });
      }
    });
    return res_el;
  }
  
  return this.each(function (element){
    // Apply handlers to the elements
    addEventHandlers(['mousedown', 'touchstart'], element);
    // Add this so we don't make things draggable twice
    element._draggable = true;
  })
})
  

