var Instance = function(fn, el, mirobot){
  this.fn = fn;
  this.el = el;
  this.mirobot = mirobot;
  this.parent = false;
  this.children = []
}

Instance.prototype = {
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
    if(this.parent){
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
    $.each(this.fn.content, function(i, item){
      if(typeof item === 'object'){
        args[item.name] = $(self.el).find('[name='+ item.name + ']')[0].value;
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
  $.each(this.functions, function(i, f){
    self.fns[f.name] = f;
  });
}

Builder.prototype = {
  prog:null,
  init: function(){
    var self = this;
    var adjustment;
    this.el.addClass('editor');
    var left = $('<div class="left container"><h2>Toolbox</h2></div>');
    this.functionList = $('<ol class="functionList"></ol>');
    left.append(this.functionList);
    var right = $('<div class="right container"><h2>Program</h2></div>');
    this.program = $('<ol class="program"></ol>');
    right.append(this.program);
    this.program.sortable({
      group: 'main',
      nested: true,
      vertical: true,
      pullPlaceholder: false,
      exclude: 'input,select',

      // set item relative to cursor position
      onDragStart: function (item, container, _super) {
        var offset = item.offset(),
        pointer = container.rootGroup.pointer

        adjustment = {
          left: pointer.left - offset.left,
          top: pointer.top - offset.top
        }

        if(!container.options.drop){
          item.clone().insertAfter(item)
        }
        
        _super(item, container)
      },
      onDrag: function (item, position) {
        item.css({
          left: position.left - adjustment.left,
          top: position.top - adjustment.top
        })
      },
      onCancel: function (item, container, _super) {
        item.remove();
      }
    });
    this.functionList.sortable({
      group: 'main',
      drop: false,
      exclude: 'input,select'
    });
    
    this.el.append(left);
    this.el.append(right);
    this.runner = $('<button class="run">&#9654; Run</button>');
    this.pause = $('<button class="pause">&#10074;&#10074; Pause</button>');
    this.pause.on('click', function(e){self.pauseProgram(e)});
    this.pause.hide();
    this.stop = $('<button class="stop">&#9724; Stop</button>');
    this.clear = $('<button class="clear">&#10006; Clear</button>');
    this.runner.on('click', function(e){self.runProgram(e)});
    this.stop.on('click', function(e){self.stopProgram(e)});
    this.clear.on('click', function(e){self.clearProgram(e)});
    this.mirobot.addListener(function(state){ self.mirobotHandler(state) });
    right.append(this.runner);
    right.append(this.pause);
    right.append(this.stop);
    right.append(this.clear);
    
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
    $.each(this.functions, function(i, f){
      var fn = $('<li class="function fn-' + f.name + '" data-fntype="' + f.name + '" draggable="true"></li>');
      for(var i in f.content){
        if(typeof(f.content[i]) === 'string'){
          fn.append('<span> ' + f.content[i] + ' </span>');
        }else if(typeof(f.content[i]) === 'object'){
          if(f.content[i].input === 'number'){
            fn.append('<input type="text" size="4" name="' + f.content[i].name + '" value="' + f.content[i].default + '" />');
          }else if(f.content[i].input === 'option'){
            var select = $('<select name="'+ f.content[i].name +'"/> ');
            select.on('change', function(e){
              var el = $(this);
              el.find("option").each(function(){
                if ($(this).text() == el.val()) {
                    $(this).attr("selected",true);
                } else {
                    $(this).removeAttr("selected");
                }
              });
            });
            for(var j in f.content[i].values){
              var opt = $('<option value="' + f.content[i].values[j] + '">' + f.content[i].values[j] + '</option>');
              if(f.content[i].default === f.content[i].values[j]){
                opt.attr('selected', 'selected');
              }
              select.append(opt);
            }
            fn.append(select);
          }
        }
      }
      
      if(f.type === 'parent'){
        fn.append('<ol></ol>');
      }

      self.el.find('.functionList').append(fn);
    });
  },
  runProgram: function(){
    if(this.paused){
      this.mirobot.resume(function(){
        console.log('resumed');
      });
    }else{
      this.prog = new Instance(null, null, null);
      this.generate(this.el.find('ol.program'), this.prog);
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
    this.el.find('ol.program li').remove();
  },
  generate: function(el, parent){
    var self = this;
    $(el).children('li').each(function(i, f){
      var fn = self.fns[$(f).data('fntype')];
      var inst = new Instance(fn, f, self.mirobot);
      parent.addChild(inst);
      if(fn.type === 'parent'){
        self.generate($(f).children('ol'), inst);
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