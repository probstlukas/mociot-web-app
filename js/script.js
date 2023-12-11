const mazeElement = document.getElementById("maze");
const ballElements = [];

const pathWidth = 25;
const wallWidth = 10;

// Balls in the maze
const balls = [
    { column: 0, row: 0 },
    { column: 9, row: 0 },
    { column: 0, row: 8 },
    { column: 9, row: 8 },
].map((ball) => ({
    x: ball.column * (wallWidth + pathWidth) + (wallWidth / 2 + pathWidth / 2),
    y: ball.row * (wallWidth + pathWidth) + (wallWidth / 2 + pathWidth / 2),
    velocityX: 0,
    velocityY: 0,
}));

// Draw balls at the beginning
balls.forEach(({ x, y }) => {
    const ball = document.createElement("div");
    ball.setAttribute("class", "ball");
    ball.style.cssText = `left: ${x}px; top: ${y}px; `;
  
    mazeElement.appendChild(ball);
    ballElements.push(ball);
  });