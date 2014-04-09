var Mirobot = function(url){
  this.url = url;
  this.connect();
  this.cbs = {};
  this.connListeners = [];
}

Mirobot.prototype = {

  connected: false,

  connect: function(){
    if(!this.connected){
      var self = this;
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = function(ws_msg){self.handle_ws(ws_msg)};
      this.ws.onopen = function(){ self.setConnectedState(true)}
      this.ws.onerror = function(err){self.handleError(err)}
      this.ws.onclose = function(err){self.handleError(err)}
    }
  },

  setConnectedState: function(state){
    var self = this;
    self.connected = state;
    for(i in self.connListeners){
      self.connListeners[i](state);
    }
    // Try to auto reconnect if disconnected
    if(state){
      if(self.reconnectTimer){
        clearInterval(self.reconnectTimer);
        self.reconnectTimer = undefined;
      }
    }else{
      if(!self.reconnectTimer){
        self.reconnectTimer = setInterval(function(){
          self.connect();
        }, 1000);
      }
    }
  },

  addConnectionListener: function(listener){
    this.connListeners.push(listener);
  },

  handleError: function(err){
    if(err instanceof CloseEvent){
      this.setConnectedState(false);
    }else{
      console.log(err);
    }
  },

  move: function(direction, distance, cb){
    this.send({cmd: direction, arg: distance}, cb);
  },

  turn: function(direction, angle, cb){
    this.send({cmd: direction, arg: angle}, cb);
  },

  penup: function(cb){
    this.send({cmd: 'penup'}, cb);
  },

  pendown: function(cb){
    this.send({cmd: 'pendown'}, cb);
  },

  ping: function(cb){
    this.send({cmd: 'ping'}, cb);
  },
  
  stop: function(){
    for(var i in this.cbs){
      this.cbs[i]('complete');
    }
    this.robot_state = 'idle';
    this.msg_stack = [];
    this.cbs = {}
  },

  send: function(msg, cb){
    msg.id = Math.random().toString(36).substr(2, 10)
    this.cbs[msg.id] = cb;
    if(msg.arg){ msg.arg = msg.arg.toString(); }
    this.push_msg(msg);
  },
  
  push_msg: function(msg){
    this.msg_stack.push(msg);
    this.run_stack();
  },
  
  run_stack: function(){
    if(this.robot_state === 'idle' && this.msg_stack.length > 0){
      this.robot_state = 'receiving';
      console.log(this.msg_stack[0]);
      this.ws.send(JSON.stringify(this.msg_stack[0]));
    }
  },
  
  handle_ws: function(ws_msg){
    msg = JSON.parse(ws_msg.data);
    console.log(msg);
    if(this.msg_stack.length > 0 && this.msg_stack[0].id == msg.id){
      if(msg.status === 'accepted'){
        if(this.cbs[msg.id]){
          this.cbs[msg.id]('started');
        }
        this.robot_state = 'running';
      }else if(msg.status === 'complete'){
        if(this.cbs[msg.id]){
          this.cbs[msg.id]('complete');
          delete this.cbs[msg.id];
        }
        this.msg_stack.shift();
        this.robot_state = 'idle';
        this.run_stack();
      }
    }else{
      this.robot_state = 'idle';
      this.run_stack();
    }
  },
  
  robot_state: 'idle',
  msg_stack: []
}
