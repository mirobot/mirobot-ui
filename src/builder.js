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
    right.append($('<div class="function start"><svg class="bg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" width="350px" height="150px" viewBox="0 0 350 150" enable-background="new 0 0 320 125" xml:space="preserve"><filter id="dropshadow" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="6" dy="6" result="offsetblur"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter><polygon fill="#FFFFFF" stroke="#666" points="180,25 25,25 25,50 25,70 90,70 85,85 185,85 180,70 300,70 300,25"/></svg><div class="details">Start</div></div>'));
    this.program = $('<ol class="program"></ol>');
    right.append(this.program);
    this.program.sortable({
      group: 'main',
      nested: true,
      vertical: true,
      pullPlaceholder: false,
      exclude: 'input,select',
      placeholder: '<li class="function placeholder">' + self.svgData('child', undefined, true) + '</li>',

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
  svgData: function(type, children, placeholder){
    var pegHeight = 15;
    var pegWidth = 90;
    var pegInset = 5;
    var pegOffset = 65;
    var x_offset = 25;
    var y_offset = 25;
    var width = 275;
    var childHeight = 60;
    if(type === 'child'){
      var coords = [[x_offset, y_offset], //25,25
                    [x_offset, y_offset + childHeight], //25,85
                    [x_offset + pegOffset, y_offset + childHeight], //90,85
                    [x_offset + pegOffset - pegInset, y_offset + childHeight + pegHeight], //85,100
                    [x_offset + pegOffset + pegWidth + pegInset , y_offset + childHeight + pegHeight], //185,100
                    [x_offset + pegOffset + pegWidth, y_offset + childHeight], //180,85
                    [x_offset + width, y_offset + childHeight], //300,85
                    [x_offset + width, y_offset], //300,25
                    [x_offset + pegOffset + pegWidth, y_offset], //180,25
                    [x_offset + pegOffset + pegWidth + pegInset, y_offset + pegHeight], //185,40
                    [x_offset + pegOffset - pegInset, y_offset + pegHeight], //85,40
                    [x_offset + pegOffset, y_offset], //90,25
                   ];
      var funcHeight = childHeight + pegHeight;
    }else{
      var insetMargin = 15;
      var height = childHeight + 2*pegHeight + children * childHeight;
      var coords = [[x_offset, y_offset], //25,25
                    [x_offset, y_offset + height], //25,85
                    [x_offset + pegOffset, y_offset + height], //90,85
                    [x_offset + pegOffset - pegInset, y_offset + height + pegHeight], //85,100
                    [x_offset + pegOffset + pegWidth + pegInset , y_offset + height + pegHeight], //185,100
                    [x_offset + pegOffset + pegWidth, y_offset + height], //180,85
                    [x_offset + width, y_offset + height], //300,85
                    [x_offset + width, y_offset + height - 2*pegHeight], //inner start
                    [x_offset + pegOffset, y_offset + height - 2*pegHeight], //300,85
                    [x_offset + insetMargin, y_offset + height - 2*pegHeight], //300,85
                    [x_offset + insetMargin, y_offset + height - 2*pegHeight - children * childHeight], //300,85
                    [x_offset + width, y_offset + height - 2*pegHeight - children * 60], //inner end
                    [x_offset + width, y_offset], //300,25
                    [x_offset + pegOffset + pegWidth, y_offset], //180,25
                    [x_offset + pegOffset + pegWidth + pegInset, y_offset + pegHeight], //185,40
                    [x_offset + pegOffset - pegInset, y_offset + pegHeight], //85,40
                    [x_offset + pegOffset, y_offset], //90,25
                   ];
      var funcHeight = (children + 1) * childHeight + 2*pegHeight;
    }
    var output_arr = [];
    for(var i in coords){
      output_arr.push(coords[i].join(','));
    }
    var canvasWidth = width + 2*x_offset
    var canvasHeight = funcHeight + 2*y_offset;
    if(placeholder){
      return '<svg class="bg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" width="' + canvasWidth + 'px" height="' + canvasHeight + 'px" viewBox="0 0 ' + canvasWidth + ' ' + canvasHeight + '" enable-background="new 0 0 ' + canvasWidth + ' ' + canvasHeight + '" xml:space="preserve"><polygon fill="#FFFFFF" stroke="#666" stroke-dasharray="5,5" points="' + output_arr.join(' ') + '"/></svg>'
    }
    return '<svg class="bg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" width="' + canvasWidth + 'px" height="' + canvasHeight + 'px" viewBox="0 0 ' + canvasWidth + ' ' + canvasHeight + '" enable-background="new 0 0 ' + canvasWidth + ' ' + canvasHeight + '" xml:space="preserve"><filter id="dropshadow" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="6" dy="6" result="offsetblur"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter><polygon fill="#FFFFFF" stroke="#666" points="' + output_arr.join(' ') + '"/></svg>';
  },
  addFunctions: function(){
    var self = this;
    $.each(this.functions, function(i, f){
      if(f.type === 'parent'){
        var childCount = 1;
        var fn = $('<li class="function fn-' + f.name + '" data-fntype="' + f.name + '">' + self.svgData(f.type, childCount) + '</li>');
      }else{
        var fn = $('<li class="function fn-' + f.name + '" data-fntype="' + f.name + '">' + self.svgData(f.type) + '</li>');
      }
      var details = $('<div class="details"></div>')
      fn.append(details);
      for(var i in f.content){
        if(typeof(f.content[i]) === 'string'){
          details.append('<span> ' + f.content[i] + ' </span>');
        }else if(typeof(f.content[i]) === 'object'){
          if(f.content[i].input === 'number'){
            details.append('<input type="text" size="4" name="' + f.content[i].name + '" value="' + f.content[i].default + '" />');
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
            details.append(select);
          }
        }
      }
      
      if(f.type === 'parent'){
        details.append('<ol></ol>');
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