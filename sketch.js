var curCanvas, canvasContainer;
var startingPoint, endPoint;
const topWall = 0,
  rightWall = 1,
  bottomWall = 2,
  leftWall = 3;
var cols, row;
var w;
var grid = [];
var solStack = []
var LEVEL = "EASY";
var solutionHead;
var movementAllowed = true;
var mazeCompleted = false;
var wSF, wSF2; // walkingSoundEffect
var forSoundEffect = false;
var aplSF
var movesCounter = 0
// timer
const TIME_LIMIT = 20;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;


function stopTimer() {
  clearInterval(timerInterval);
}

function startTimer() {
  stopTimer(timerInterval);
  timePassed = 0;
  timerInterval = setInterval(() => {
    timePassed = timePassed += 1;
    if (mazeCompleted || timePassed >= 60 * 60 * 24)
      stopTimer();
    document.getElementById("timer").innerHTML = formatTime(timePassed);

  }, 1000);
}

function formatTime(time) {
  let hours = Math.floor(time / 3600);

  let minutes = Math.floor(time % 3600 / 60);
  let seconds = time % 60;

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  if (minutes < 10) minutes = '0' + minutes
  if (hours < 10) hours = '0' + hours

  return `${hours}:${minutes}:${seconds}`;
}

function preload() {
  // wSF = loadSound("res/walkingSoundEffect3.mp3")
  // wSF2 = loadSound("res/walkingSoundEffect2.mp3")
  aplSF = loadSound("res/applause10.mp3")
}

function setup() {
  newGame();
}

var noCell = {
  i: NaN,
  j: NaN,
  walls: null,
  visited: true
}

function giveNeighbor(r, c) {

  if ((0 <= r && r < rows) && (0 <= c && c < cols)) {

    return grid[r][c]
  }
  return noCell;
}

function Cell(i, j) {
  this.i = i;
  this.j = j;
  this.walls = new Array(4).fill(true)
  this.visited = false;
  this.show = () => {
    // fill(random(255))
    var x = this.i * w;
    var y = this.j * w;
    stroke(0);
    var wallWidth = 1
    if (this.visited) {


      if (LEVEL === "EASY") wallWidth = 5
      noStroke();
      fill(20, 20, 0);
      rectMode(CENTER)
      rect(x + w / 2, y + w / 2, w - 0 * wallWidth, w - 0 * wallWidth);
      rectMode(CORNER)

      stroke(255)
      strokeWeight(wallWidth)
      rectMode(CENTER)
      if (this.walls[topWall]) line(x, y, x + w, y)
      if (this.walls[rightWall]) line(x + w, y, x + w, y + w)
      if (this.walls[bottomWall]) line(x + w, y + w, x, y + w)
      if (this.walls[leftWall]) line(x, y + w, x, y)
      strokeWeight(1)
      rectMode(CORNER)

    } else {
      noStroke();
      noFill()
      rectMode(CENTER)
      rect(x + w / 2, y + w / 2, w - wallWidth, w - wallWidth);
      rectMode(CORNER)
    }

  }

  this.checkNeighbor = () => {
    var top, bottom, left, right;
    top = giveNeighbor(this.i - 1, this.j)
    right = giveNeighbor(this.i, this.j + 1)
    bottom = giveNeighbor(this.i + 1, this.j)
    left = giveNeighbor(this.i, this.j - 1)

    var neighbors = []
    for (let possible of [top, right, bottom, left])
      if (!possible.visited)
        neighbors.push(possible)

    if (neighbors.length != 0) {
      return neighbors[floor(random(neighbors.length))]
    }
    return noCell
  }
}


function removeWalls(cur, nxt) {
  var xDif = cur.i - nxt.i,
    yDif = cur.j - nxt.j;
  switch (xDif) {
    case 0:
      switch (yDif) {
        case 1:
          cur.walls[topWall] = nxt.walls[bottomWall] = false;
          break;
        case -1:
          cur.walls[bottomWall] = nxt.walls[topWall] = false;

      }
      break;
    case 1:
      cur.walls[leftWall] = nxt.walls[rightWall] = false;
      break;
    case -1:
      cur.walls[rightWall] = nxt.walls[leftWall] = false;
  }
}



function genMaze(bound = 100) {
  let sX, sY, current;
  sX = floor(random(cols))
  sY = floor(random(rows))
  current = grid[sX][sY];

  let few = 10
  let lastFewBreakingPoints = []
  var recursionStack = []
  var visitedCount = 0,
    visitedCountLim = grid[0].length * grid.length;

  visitedCountLim = min(visitedCountLim, bound);

  while (visitedCount != visitedCountLim) {

    current.visited = true;
    visitedCount++;
    var next = current.checkNeighbor()
    if (next != noCell) {
      next.visited = true;
      recursionStack.push(current)
      removeWalls(current, next)
      current = next;
    } else if (recursionStack.length != 0) {
      current = recursionStack.pop()
      if (lastFewBreakingPoints.length >= few) {
        lastFewBreakingPoints.splice(0, 1)
      }
      lastFewBreakingPoints.push(current)
      visitedCount--;
    }
  }

  let eX, eY, endCell
  var manhattan = (x1, y1, x2, y2) => abs(x1 - x2) + abs(y1 - y2);

  do {
    eX = floor(random(cols))
    eY = floor(random(rows))
    endCell = grid[eX][eY]
  } while (!endCell.visited || grid[sX][sY] == endCell || manhattan(sX, sY, eX, eY) <= 5)


  return [grid[sX][sY], endCell]
}

function whereToMove(movedTo = noCell) {
  // S = Start C = current E = end L = line
  function printSCEL() {
    rectMode(CORNER)
    fill(0)
    if (prev != noCell)
      prev.show()

    rectMode(CENTER)
    fill(0, 244, 244)
    rect(startingPoint.i * w + w / 2, startingPoint.j * w + w / 2, w * 0.8, w * 0.8)

    fill(0, 244, 0)
    rect(endPoint.i * w + w / 2, endPoint.j * w + w / 2, w * 0.8, w * 0.8)

    fill(244, 255, 200)
    rect(solutionHead.i * w + w / 2, solutionHead.j * w + w / 2, w * 0.7, w * 0.7)
    rectMode(CORNER)
  }

  let prev = noCell

  if (movedTo != noCell) { // do path tracing

    forSoundEffect = !forSoundEffect;
    prev = solutionHead
    solutionHead = movedTo; //this ; is imp as below is anony. function invocation

    //moves-counter update
    movesCounter++;
    document.getElementById('moves').innerHTML = movesCounter

    printSCEL();
    if (solStack.length == 0) {
      solStack.push([prev.i, prev.j])


      strokeWeight(3)
      stroke(244, 244, 0)
      line(prev.i * w + w / 2, prev.j * w + w / 2, movedTo.i * w + w / 2, movedTo.j * w + w / 2)
      strokeWeight(1)


    } else {
      let top = solStack[solStack.length - 1]
      if (top[0] === solutionHead.i && top[1] === solutionHead.j) {
        solStack.pop()
        if (prev != noCell && prev != startingPoint && prev != endPoint) {
          prev.show()
          solutionHead.show()
        }

        rectMode(CENTER)
        fill(244, 255, 200)
        rect(solutionHead.i * w + w / 2, solutionHead.j * w + w / 2, w * 0.7, w * 0.7)
        rectMode(CORNER)

      } else {
        strokeWeight(3)
        stroke(244, 244, 0)
        line(prev.i * w + w / 2, prev.j * w + w / 2, movedTo.i * w + w / 2, movedTo.j * w + w / 2)
        strokeWeight(1)
        solStack.push([prev.i, prev.j])
      }
    }
    if (solutionHead == endPoint) {
      // window.alert("Mission Complete")
      setTimeout(congrats, 500);
      movementAllowed = false;
      mazeCompleted = true;
      // path tracking: 
      let prev = [startingPoint.i, startingPoint.j]
      let curIndex = 1
      let cur = solStack[int(curIndex)]

      stroke(244, 30, 194)
      var wt = 2;
      while (cur && !(cur[0] == prev[0] && cur[1] == prev[1])) {

        if (LEVEL === "EASY") wt = 5;
        strokeWeight(wt)

        line(prev[0] * w + w / 2, prev[1] * w + w / 2, cur[0] * w + w / 2, cur[1] * w + w / 2)
        strokeWeight(1)
        prev = cur
        curIndex += 1
        cur = solStack[curIndex]
      }
      cur = [solutionHead.i, solutionHead.j]
      strokeWeight(wt)

      line(prev[0] * w + w / 2, prev[1] * w + w / 2, cur[0] * w + w / 2, cur[1] * w + w / 2)
      strokeWeight(1)
    }


  }


}

function keyPressed() {
  var movedTo = noCell;
  if (movementAllowed && !mazeCompleted) {
    switch (keyCode) {

      case UP_ARROW:
        if (!solutionHead.walls[topWall])
          movedTo = giveNeighbor(solutionHead.i, solutionHead.j - 1)
        break;
      case RIGHT_ARROW:
        if (!solutionHead.walls[rightWall])
          movedTo = giveNeighbor(solutionHead.i + 1, solutionHead.j)
        break;
      case DOWN_ARROW:
        if (!solutionHead.walls[bottomWall])
          movedTo = giveNeighbor(solutionHead.i, solutionHead.j + 1)
        break;
      case LEFT_ARROW:
        if (!solutionHead.walls[leftWall])
          movedTo = giveNeighbor(solutionHead.i - 1, solutionHead.j)
        break;
    }

    whereToMove(movedTo)



  }

}

function movementByButton(dir) {
  var movedTo = noCell
  if (movementAllowed && !mazeCompleted) {
    switch (dir) {
      case 'u':
        if (!solutionHead.walls[topWall])
          movedTo = giveNeighbor(solutionHead.i, solutionHead.j - 1)
        break;
      case 'r':
        if (!solutionHead.walls[rightWall])
          movedTo = giveNeighbor(solutionHead.i + 1, solutionHead.j)
        break;
      case 'd':
        if (!solutionHead.walls[bottomWall])
          movedTo = giveNeighbor(solutionHead.i, solutionHead.j + 1)
        break;
      case 'l':
        if (!solutionHead.walls[leftWall])
          movedTo = giveNeighbor(solutionHead.i - 1, solutionHead.j)
        break;
    }
    whereToMove(movedTo)
  }
}

function windowResized() {
  resizeCanvas(10, 10)
  let c = select("#canvasContainer")
  let d = min(c.width, c.height);
  d -= 3
  w = d / rows;
  resizeCanvas(d, d);
  grid.forEach(row => row.forEach(cell => cell.show()))

  rectMode(CENTER)
  fill(0, 244, 244)
  rect(startingPoint.i * w + w / 2, startingPoint.j * w + w / 2, w * 0.8, w * 0.8)


  fill(0, 244, 0)
  rect(endPoint.i * w + w / 2, endPoint.j * w + w / 2, w * 0.8, w * 0.8)

  fill(244, 255, 200)
  rect(solutionHead.i * w + w / 2, solutionHead.j * w + w / 2, w * 0.7, w * 0.7)

  rectMode(CORNER)

  // path tracking: 
  let prev = [startingPoint.i, startingPoint.j]
  let curIndex = 1
  let cur = solStack[int(curIndex)]

  var wt = 2;
  while (cur && !(cur[0] == prev[0] && cur[1] == prev[1])) {
    if (LEVEL === "EASY") wt = 5;
    strokeWeight(wt)
    stroke(244, 244, 0)
    line(prev[0] * w + w / 2, prev[1] * w + w / 2, cur[0] * w + w / 2, cur[1] * w + w / 2)
    strokeWeight(1)
    prev = cur
    curIndex += 1
    cur = solStack[curIndex]
  }
  cur = [solutionHead.i, solutionHead.j]
  strokeWeight(wt)
  stroke(244, 244, 0)
  line(prev[0] * w + w / 2, prev[1] * w + w / 2, cur[0] * w + w / 2, cur[1] * w + w / 2)
  strokeWeight(1)
}

function deviceTurned() {
  // alert("device rotation observed. Please reload!!!")

  let c = select("#canvasContainer")
  resizeCanvas(10, 10)
  let d = min(c.width, c.height);
  d -= 3
  w = d / rows;
  resizeCanvas(d, d);
  grid.forEach(row => row.forEach(cell => cell.show()))

  rectMode(CENTER)
  fill(0, 244, 244)
  rect(startingPoint.i * w + w / 2, startingPoint.j * w + w / 2, w * 0.8, w * 0.8)


  fill(0, 244, 0)
  rect(endPoint.i * w + w / 2, endPoint.j * w + w / 2, w * 0.8, w * 0.8)

  fill(244, 255, 200)
  rect(solutionHead.i * w + w / 2, solutionHead.j * w + w / 2, w * 0.7, w * 0.7)

  rectMode(CORNER)

  // path tracking: 
  let prev = [startingPoint.i, startingPoint.j]
  let curIndex = 1
  let cur = solStack[int(curIndex)]

  var wt = 2;
  while (cur && !(cur[0] == prev[0] && cur[1] == prev[1])) {
    if (LEVEL === "EASY") wt = 5;
    strokeWeight(wt)
    stroke(244, 244, 0)
    line(prev[0] * w + w / 2, prev[1] * w + w / 2, cur[0] * w + w / 2, cur[1] * w + w / 2)
    strokeWeight(1)
    prev = cur
    curIndex += 1
    cur = solStack[curIndex]
  }
  cur = [solutionHead.i, solutionHead.j]
  strokeWeight(wt)
  stroke(244, 244, 0)
  line(prev[0] * w + w / 2, prev[1] * w + w / 2, cur[0] * w + w / 2, cur[1] * w + w / 2)
  strokeWeight(1)
}

function openSettings() {
  var popUp = document.querySelector('.pop-up');
  var popUpCards = [...popUp.getElementsByClassName('pop-up-card')]
  var settingCard = popUpCards[1]
  popUp.classList.toggle('hidden', false);
  settingCard.classList.toggle('hidden', false);

  movementAllowed = false;
}

function closePopUps() {
  var popUp = document.querySelector('.pop-up');
  var popUpCards = [...popUp.getElementsByClassName('pop-up-card')]
  popUpCards.forEach(popUpCard => popUpCard.classList.toggle('hidden', true))
  popUp.classList.toggle('hidden', true);
  movementAllowed = true;
}

function changeLevel(changeLevelTo = "EASY") {
  switch (changeLevelTo) {
    case "MED": break;
    case "HARD": break;
    default: changeLevelTo = "EASY";
  }
  LEVEL = changeLevelTo
  newGame();
}

function newGame() {
  background(0);
  // timePassed = 0; // redundant as done in startTimer() itself
  movesCounter = 0;

  $('#moves').html('00')

  solStack = []
  grid = []
  mazeCompleted = false;

  canvasContainer = select("#canvasContainer")


  let dimension = min(canvasContainer.width, canvasContainer.height);

  curCanvas = createCanvas(dimension, dimension);

  canvasContainer.child(curCanvas)

  let upperBoundOnFill = 100;
  let mazeDim = 10;
  // LEVEL = "HARD";
  switch (LEVEL) {
    case "EASY":
      upperBoundOnFill = floor(random(100, 200))
      mazeDim = floor(random(5, 15));
      break;
    case "MED":
      upperBoundOnFill = floor(random(500, 700))
      mazeDim = floor(random(15, 35));
      break;
    case "HARD":
      upperBoundOnFill = floor(random(1200, 3000))
      mazeDim = floor(random(30, 55));

  }
  rows = cols = mazeDim
  w = dimension / rows;
  for (var r = 0; r < rows; ++r) {
    let tmp = []
    for (var c = 0; c < cols; ++c) tmp.push(new Cell(r, c))
    grid.push(tmp)
  }



  let tmp = genMaze(upperBoundOnFill)
  grid.forEach(row => row.forEach(cell => cell.show()))
  startingPoint = tmp[0]
  endPoint = tmp[1]



  solutionHead = startingPoint

  rectMode(CENTER)
  fill(0, 244, 244)
  rect(startingPoint.i * w + w / 2, startingPoint.j * w + w / 2, w * 0.8, w * 0.8)


  fill(0, 244, 0)
  rect(endPoint.i * w + w / 2, endPoint.j * w + w / 2, w * 0.8, w * 0.8)

  fill(244, 255, 200)
  rect(solutionHead.i * w + w / 2, solutionHead.j * w + w / 2, w * 0.7, w * 0.7)

  rectMode(CORNER)

  startTimer();
}

function congrats() {
  movementAllowed = false;
  aplSF.play()
  var popUp = document.querySelector('.pop-up');
  var popUpCards = [...popUp.getElementsByClassName('pop-up-card')]
  var settingCard = popUpCards[0]
  popUp.classList.toggle('hidden', false);
  settingCard.classList.toggle('hidden', false);

}


function draw() {
}


