var sw = 20; // 方块宽
var sh = 20; // 方块高
var tr = 30; // 行
var td = 30; // 列
var snake = null; // snake实例
var food = null; // 食物的实例
var game = null; //游戏的实例

// 构造函数Square,到时候直接new一个snake头，snake身体，food；x，y表示方块的坐标；
// classname表示独特的方块名
function Square(x, y, classname) {

  this.x = x * sw; //坐标*20
  this.y = y * sh;
  this.class = classname;

  // 每一个方块对应的dom元素
  this.viewContent = document.createElement('div');
  this.viewContent.className = this.class;
  this.parent = document.getElementById('snakeWrap'); //方块的父级
}

Square.prototype.create = function(){
  this.viewContent.style.position = 'absolute';
  this.viewContent.style.width = sw + 'px';
  this.viewContent.style.height = sh + 'px';
  this.viewContent.style.left = this.x + 'px';
  this.viewContent.style.top = this.y + 'px';

  this.parent.appendChild(this.viewContent);
}

Square.prototype.remove = function () {
  
  this.parent.removeChild(this.viewContent);
}

// 创建snake
function Snake(){
  this.head = null; // 存一下snake头的信息
  this.tail = null;
  this.pos = []; // 存snake身上每一个方块的位置，二维数组，表示头，第一节身体……

  this.direactionNum = { // 存储snake走的方向，用一个对象表示
    left: {
      x: -1,
      y: 0,
      rotate: 180
    },
    right: {
      x: +1,
      y: 0,
      rotate: 0
    },
    up: {
      x: 0,
      y: -1,
      rotate: -90
    },
    down: {
      x: 0,
      y: +1,
      rotate: 90
    }
  }
}

// init用于初始化，做一些准备工作
Snake.prototype.init = function(){
  
  // 创建snake头
  var snakeHead = new Square(2, 0, 'snakeHead');
  snakeHead.create();
  this.head = snakeHead; // 存储snake信息
  this.pos.push([2,0]); // snake位置存起来

  
  // 创建snake身体1
  var snakeBody1 = new Square(1, 0, 'snakeBody');
  snakeBody1.create();
  this.pos.push([1,0]); //snake身体1位置存起来

  // 创建snake身体2
  var snakeBody2 = new Square(0, 0, 'snakeBody');
  snakeBody2.create();
  this.tail = snakeBody2; // snake尾巴信息存储
  this.pos.push([0,0]); //snake身体2位置存起来

  
  // 形成链表关系，使snake各个部分形成一个整体
  snakeHead.last = null;
  snakeHead.next = snakeBody1;

  snakeBody1.last = snakeHead;
  snakeBody1.next = snakeBody2;

  snakeBody2.last = snakeBody1;
  snakeBody2.next = null;
  
  // 给snake添加一条属性，用于表示snake走的方向
  this.direaction = this.direactionNum.right; // 默认snake向右走
}

// 获取snake的下一位置对应的元素，根据元素做不同事情，如墙、食物
Snake.prototype.getNextPos = function(){
  
  // snake要走的下一个点的坐标
  var nextPos = [this.head.x/sw + this.direaction.x, this.head.y/sh + this.direaction.y]
  // 下一个点是自己，代表撞到了自己，游戏结束
  var selfCollied = false;
  this.pos.forEach(function(value) {
    // 数组中的两个点都一致，表示撞到自己了
    if (value[0] == nextPos[0] && value[1] == nextPos[1]){
      selfCollied = true
    }
  });
  if (selfCollied) {
    this.strategies.die.call(this)
    return;
  }

  // 下个点是围墙，游戏结束
  if (nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td -1 || nextPos[1] > tr - 1) {
    this.strategies.die.call(this)
    return;
  }

  // 下个点是苹果，吃
  // this.strategies.eat.call(this)
  if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
    // 需要吃
    this.strategies.eat.call(this)
    return
  }

  // 下个点什么都没有，走
  this.strategies.move.call(this)
}

// 处理碰撞后要做的事情
Snake.prototype.strategies = {
  move: function(format){ // format参数用于判断是否要删除snake尾部,传了之后表示吃
    

    // 创建新身体，在旧snake头的位置
    var newBody = new Square(this.head.x/sw, this.head.y/sh,'snakeBody');
    // 更新链表关系
    newBody.next = this.head.next;
    newBody.next.last = newBody;
    newBody.last = null;
    
    this.head.remove(); // 旧snake头从原来的位置删除
    newBody.create();
    
    // 创建新的snake头，下一个要走到的点
    var newHead = new Square(this.head.x/sw + this.direaction.x,this.head.y/sh + this.direaction.y,'snakeHead');

    // 更新链表的关系
    newHead.next = newBody;
    newHead.last = null;
    newBody.last = newHead;
    newHead.viewContent.style.transform = 'rotate('+this.direaction.rotate+ 'deg)'
    newHead.create();

    
    // snake身上每一个方块坐标更新,原来头的位置是现在身体1的位置
    this.pos.splice(0, 0, [this.head.x/sw + this.direaction.x,this.head.y/sh + this.direaction.y])
    this.head = newHead; // 更新头

    // 删除尾部，如果下一个位置是食物，他要吃，就不用删除了，因此就会变得比原来读一个
    if(!format) {
      // format为false，需要删除tail
      this.tail.remove();
      this.tail = this.tail.last;

      this.pos.pop(); // 同时改变数组
    }
  },
  eat: function() {
    this.strategies.move.call(this, true);
    createFood();
    game.score++;
  },
  die: function() {
    game.over();
  }
}

snake= new Snake();
snake.init();
snake.getNextPos();

// 创建食物
function createFood(){
  var x = null;
  var y = null; // 食物的随机坐标
  // 食物不能出现在墙上、snake身上

  var include = true; // 循环跳出的条件，true表示食物在snake身上，需要继续循环；false
  while(include) {
    x = Math.round(Math.random() * (td - 1));
    y = Math.round(Math.random() * (tr - 1));
    snake.pos.forEach(function(value) {
      if (x != value[0] && y != value[1]) {
        // 坐标不在snake身上
        include = false;
      }
    })
  }
  food = new Square(x, y, 'food');
  food.pos = [x,y] // 存储生成食物坐标，与snake的下一个点做对比，看有没有吃到食物
  var foodDom = document.querySelector('.food');
  if (foodDom) {
    foodDom.style.left = x*sw + 'px';
    foodDom.style.top = y*sh + 'px';
  } else {
    food.create();
  }
}

// createFood()

// 创建游戏逻辑
function Game() {
  this.timer = null;
  this.score = 0;
}

Game.prototype.init = function() {
  
  // snake.init();
  createFood();

  document.onkeydown = function (ev){
    // 37左键,此时snake不能正在向右走,38上，39右，40下
    if (ev.which == 37 && snake.direaction != snake.direactionNum.left) {
      snake.direaction = snake.direactionNum.left;
    } else if (ev.which == 38 && snake.direaction != snake.direactionNum.down) {
      snake.direaction = snake.direactionNum.up;
    } else if (ev.which == 39 && snake.direaction != snake.direactionNum.left) {
      snake.direaction = snake.direactionNum.right;
    } else if (ev.which == 40 && snake.direaction != snake.direactionNum.up) {
      snake.direaction = snake.direactionNum.down;
    }
  }
  this.start();
}

Game.prototype.start = function() {
  this.timer = setInterval(function(){
    snake.getNextPos()
  },200)
}

Game.prototype.pause = function() {
  clearInterval(this.timer)
}

Game.prototype.over = function() {
  clearInterval(this.timer)
  alert("得分为：" + this.score)

  // 游戏回到最初状态
  var snakeWrap = document.getElementById('snakeWrap');
  snakeWrap.innerHTML = ''
  snake = new Snake();
  game = new Game();

  var startBtnWrap = document.querySelector('.startBtn')
  startBtnWrap.style.display = 'block'
  startBtnWrap.onclick = function() {
    game.start();
    // startBtnWrap.parentNode.style.display = 'none'
  }
}

// 开启游戏
game = new Game();
var startBtn = document.querySelector('.startBtn button')
startBtn.onclick = function(){
  startBtn.parentNode.style.display = 'none';
  game.init()
}

// 暂停游戏
var snakeWrap = document.getElementById('snakeWrap');
var pauseBtn = document.querySelector('.pauseBtn button')
snakeWrap.onclick = function() {
  game.pause()
  pauseBtn.parentNode.style.display = 'block'
}

pauseBtn.onclick = function() {
  game.start();
  pauseBtn.parentNode.style.display = 'none'
}