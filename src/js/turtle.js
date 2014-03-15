var Turtle = function(){
  var self = this;
  this.addTurtle();
  document.body.onmousemove = function(e){ return self.point(e)};
  document.body.onclick = function(e){ return self.move(e)};

}

Turtle.prototype = {
  history: [],
  moving: false,
  prev_angle: 0,
  curr_angle: 0,
  angle: 0,
  point: function(e){
    if(this.moving) return;
    this.angle = Math.atan2(e.pageX - this.x(), - (e.pageY - this.y()) )*(180/Math.PI);
    this.inner.style["-webkit-transform"] = 'rotate(' + this.angle + 'deg)';
    this.inner.style['-moz-transform'] = 'rotate(' + this.angle + 'deg)';
  },
  move: function(e){
    var self = this;
    if(self.moving) return;
    self.point(e);
    this.prev_angle = this.curr_angle;
    this.curr_angle = this.angle;
    self.moving = true;
    var rate = 5;
    var dx = e.pageX - self.x();
    var dy = e.pageY - self.y();
    var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    this.createScript(this.angle, dist);
    var steps = Math.ceil(dist/rate);
    var _dx = dx / steps;
    var _dy = dy / steps;
    this.context.beginPath();
    this.context.lineWidth = 3;
    this.context.moveTo(this.x(), this.y());
    var mover = function(){
      steps--;
      self.context.lineTo(self.x() + _dx, self.y() + _dy);
      self.context.stroke();
      if(steps === 0){
        self.moveBy(_dx, _dy);
        self.context.closePath();
        self.moving = false;
      }else{
        self.moveBy(_dx, _dy);
        window.setTimeout(mover, 30)
      }
    }
    mover();
  },
  moveBy: function(x, y){
    this.turtle.style.left = (this.turtle.getBoundingClientRect().left + x) + "px"
    this.turtle.style.top = (this.turtle.getBoundingClientRect().top + y) + "px"
  },
  createScript: function(angle, distance){
    if(this.history.length === 0){
      turnangle = angle
    }else{
      turnangle = this.prev_angle - angle;
    }
    turnangle = Math.floor(turnangle);
    if(turnangle != 0){
      if(turnangle > 180){ turnangle -= 360}
      if(turnangle < -180){ turnangle += 360}
      var dir = turnangle < 0 ? 'RIGHT ' : 'LEFT ';
      this.history.push(dir + Math.abs(turnangle));
    }
    if(Math.floor(distance) != 0){
      this.history.push('FORWARD ' + Math.floor(distance));
    }
  },
  addTurtle: function(){
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.turtle = document.createElement('div');
    this.inner = document.createElement('div');
    this.turtle.id = 'turtle'
    this.inner.id = 'inner'
    document.body.appendChild(this.canvas);
    var width = Math.max(document.documentElement["clientWidth"], document.body["scrollWidth"], document.documentElement["scrollWidth"], document.body["offsetWidth"], document.documentElement["offsetWidth"]);
    var height = Math.max(document.documentElement["clientHeight"], document.body["scrollHeight"], document.documentElement["scrollHeight"], document.body["offsetHeight"], document.documentElement["offsetHeight"]);

    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    this.context.canvas.width = width;
    this.context.canvas.height = height;
    this.turtle.style.left = width/2 + "px";
    this.turtle.style.top = height/2 + "px";
    this.turtle.appendChild(this.inner);
    document.body.appendChild(this.turtle);
  },
  x: function(){
    return this.turtle.getBoundingClientRect().left + this.turtle.getBoundingClientRect().width/2;
  },
  y: function(){
    return this.turtle.getBoundingClientRect().top + this.turtle.getBoundingClientRect().height/2;
  }
}
