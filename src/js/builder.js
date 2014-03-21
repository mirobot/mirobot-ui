var Instance = function(fn, el){
  this.fn = fn;
  this.el = el;
  this.parent = false;
  this.children = []
}

Instance.prototype = {
  run: function(children){
    var self = this;
    if(self.fn){
      // This is a function
      self.fn.run(self, function(state){ self.updateState(state)});
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

var Builder = function(el){
  var self = this;
  this.el = el;
  this.init();
  this.fns = {};
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
    this.library = $('<ol class="library"></ol>');
    this.program = $('<ol class="program"></ol>');
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
    this.library.sortable({
      group: 'main',
      drop: false,
      exclude: 'input,select'
    });
    
    this.library.find('input[type=text]').on('click', function(){ jQuery(this).focus(); });
    
    this.el.append(this.library);
    this.el.append(this.program);
    this.setHeights();
    $(window).on('resize', function(){ self.setHeights() });
    var runner = $('<button class="run">Run</button>');
    runner.on('click', function(e){self.run(e)});
    this.el.append(runner);
    
    this.addFunctions();
  },
  setHeights: function(){
    var newHeight = $(window).height() - 2 * (1 + 10 + 8);
    this.library.height(newHeight);
    this.program.height(newHeight);
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

      self.el.find('.library').append(fn);
    });
  },
  run: function(){
    this.prog = new Instance(null, null);
    this.generate(this.el.find('ol.program'), this.prog);
    this.prog.run()
  },
  generate: function(el, parent){
    var self = this;
    $(el).children('li').each(function(i, f){
      var fn = self.fns[$(f).data('fntype')];
      var inst = new Instance(fn, f);
      parent.addChild(inst);
      if(fn.type === 'parent'){
        self.generate($(f).children('ol'), inst);
      }
    });
  },
  functions:[
    {
      name:'repeat',
      type:'parent',
      content:[
        'Repeat',
        {input:'number', name:'count', default:2},
        'times'
      ],
      run: function(node, cb){
        for(var i=0; i< node.args().count; i++){
          for(var j=0; j< node.children.length; j++){
            node.children[j].run();
          }
        }
      }
    },
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
      run: function(node, cb){
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
      run: function(node, cb){
        mirobot.turn(node.args().direction, node.args().angle, cb);
      }
    },
    {
      name:'penup',
      type:'child',
      content:['Pen up'],
      run: function(node, cb){
        mirobot.penup(cb);
      }
    },
    {
      name:'pendown',
      type:'child',
      content:['Pen down'],
      run: function(node, cb){
        mirobot.pendown(cb);
      }
    }
  ]
}