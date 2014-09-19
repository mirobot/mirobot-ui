var FnInstance = function(fn, el, mirobot){
  this.fn = fn;
  this.el = el;
  this.mirobot = mirobot;
  this.parent = false;
  this.children = []
}

FnInstance.prototype = {
  run: function(children){
    var self = this;
    if(self.fn){
      // This is a function
      self.fn.run(self, self.mirobot, function(state){ self.updateState(state)});
    }else{
      // This is the root container
      for(var i in self.children){
        self.children[i].run();
      }
    }
  },
  updateState: function(state){
    if(state === 'started'){
      $(this.el).addClass('active');
    }else if(state === 'complete'){
      $(this.el).removeClass('active');
    }
    if(this.parent && this.parent.el){
      this.parent.updateState(state);
    }
  },
  addChild: function(child){
    child.parent = this;
    this.children.push(child);
  },
  args: function(){
    var self = this;
    var args ={}
    snack.each(this.fn.content, function(item){
      if(typeof item === 'object'){
        args[item.name] = self.el.querySelector('[name='+ item.name + ']').value;
      }
    });
    return args;
  }
}

var Builder = function(el, mirobot){
  var self = this;
  this.el = el;
  this.mirobot = mirobot;
  this.init();
  this.fns = {};
  this.paused = false;

  snack.each(this.functions, function(f){
    self.fns[f.name] = f;
  });
}

Builder.prototype = {
  prog:null,
  init: function(){
    var self = this;
    var adjustment;
    this.el.addClass('editor');
    this.el[0].innerHTML = this.mainUI;
    
    this.runner = $('.editor .run');
    this.pause = $('.editor .pause');
    this.stop = $('.editor .stop');
    this.clear = $('.editor .clear');
    this.runner.attach('click', function(e){self.runProgram(e)});
    this.stop.attach('click', function(e){self.stopProgram(e)});
    this.clear.attach('click', function(e){self.clearProgram(e)});
    this.mirobot.addListener(function(state){ self.mirobotHandler(state) });

    this.addFunctions();
  },
  mirobotHandler: function(state){
    if(state === 'program_complete'){
      this.runner.show();
      this.pause.hide();
    }
  },
  addFunctions: function(){
    var self = this;
    snack.each(this.functions, function(i, f){
      f = self.functions[f];
      var fn = '<li class="function fn-' + f.name + ' draggable" data-fntype="' + f.name + '">';
      for(var i in f.content){
        if(typeof(f.content[i]) === 'string'){
          fn += '<span> ' + f.content[i] + ' </span>';
        }else if(typeof(f.content[i]) === 'object'){
          if(f.content[i].input === 'number'){
            fn += '<input type="number" size="4" name="' + f.content[i].name + '" value="' + f.content[i].default + '" />';
          }else if(f.content[i].input === 'option'){
            var select = '<select name="'+ f.content[i].name +'">';
            for(var j in f.content[i].values){
              select += '<option value="' + f.content[i].values[j] + '"';
              if(f.content[i].default === f.content[i].values[j]){
                select += 'selected="selected"';
              }
              select += '>' + f.content[i].values[j] + '</option>';
            }
            select += '</select>';
            fn += select;
          }
        }
      }
      
      if(f.type === 'parent'){
        fn += '<ol><li class="end" style="display:hidden"></li></ol>';
      }
      fn += '</li>';
      $('.editor .functionList')[0].innerHTML += fn;
    });
    $('.functionList li.draggable').draggableList({
      target: 'ol.program',
      placeholder: '<li class="placeholder"/>',
      copy: true
    });
  },
  runProgram: function(){
    if(this.paused){
      this.mirobot.resume(function(){
        console.log('resumed');
      });
    }else{
      this.prog = new FnInstance(null, null, null);
      this.generate($('.editor ol.program')[0], this.prog);
      this.prog.run()
    }
    this.pause.show();
    this.runner.hide();
    this.paused = false;
  },
  pauseProgram: function(){
    var self = this;
    this.paused = true;
    this.mirobot.pause(function(){
      console.log('paused');
      self.runner.show();
      self.pause.hide();
    });
  },
  stopProgram: function(){
    var self = this;
    this.mirobot.stop(function(){
      self.runner.show();
      self.pause.hide();
      self.paused = false;
      console.log('stopped');
    });
  },
  clearProgram: function(){
    this.stopProgram();
    $('.editor ol.program li.function').remove();
  },
  generate: function(el, parent){
    var self = this;
    snack.each(el.childNodes, function(el){
      if(el.nodeName.toLowerCase() === 'li' && el.className.match(/function/) && el.dataset.fntype){
        var fn = self.fns[el.dataset.fntype];
        var inst = new FnInstance(fn, el, self.mirobot);
        parent.addChild(inst);
        if(fn.type === 'parent'){
          var children = el.childNodes;
          for(var i = 0; i< children.length; i++){
            if(children[i].nodeName.toLowerCase() === 'ol'){
              self.generate(children[i], inst);
            }
          }
        }
      }
    });
  },
  functions:[
    {
      name:'move',
      type:'child',
      content:[
        'Move',
        {input:'option', name:'direction', default:'forward', values:['forward', 'back']},
        'by',
        {input:'number', name:'distance', default:100},
        'mm'
      ],
      run: function(node, mirobot, cb){
        mirobot.move(node.args().direction, node.args().distance, cb);
      }
    },
    {
      name:'turn',
      type:'child',
      content:[
        'Turn',
        {input:'option', name:'direction', default:'left', values:['left', 'right']},
        'by',
        {input:'number', name:'angle', default:90},
        'degrees'
      ],
      run: function(node, mirobot, cb){
        mirobot.turn(node.args().direction, node.args().angle, cb);
      }
    },
    {
      name:'penup',
      type:'child',
      content:['Pen up'],
      run: function(node, mirobot, cb){
        mirobot.penup(cb);
      }
    },
    {
      name:'pendown',
      type:'child',
      content:['Pen down'],
      run: function(node, mirobot, cb){
        mirobot.pendown(cb);
      }
    },
    {
      name:'repeat',
      type:'parent',
      content:[
        'Repeat',
        {input:'number', name:'count', default:2},
        'times'
      ],
      run: function(node, mirobot, cb){
        for(var i=0; i< node.args().count; i++){
          for(var j=0; j< node.children.length; j++){
            node.children[j].run();
          }
        }
      }
    }
  ]
}



Builder.prototype.mainUI = '<div class="left container"><h2>Toolbox</h2>\
<ol class="functionList"></ol>\
</div>\
<div class="right container"><h2>Program</h2>\
<ol class="program">\
<li class="end" style="display:hidden"></li>\
</ol>\
<button class="run">&#9654; Run</button><button class="pause" style="display:none;">&#10074;&#10074; Pause</button><button class="stop">&#9724; Stop</button><button class="clear">&#10006; Clear</button>\
</div>\
';