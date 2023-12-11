const mazeElement = document.getElementById("maze");
const ballElements = [];

const pathWidth = 30;
const wallWidth = 10;

/* Implementation of balls  */

// Balls in the maze
const balls = [
    { column: 0, row: 0 },
    { column: 9, row: 0 },
    { column: 0, row: 9 },
    { column: 9, row: 9 },
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
    ball.style.left = `${x}px`;
    ball.style.top = `${y}px`;
  
    mazeElement.appendChild(ball);
    ballElements.push(ball);
  });

/* Implementation of walls  */

// Wall configurations for the maze layout
const walls = [
    // Border
    { column: 0, row: 0, horizontal: true, length: 10 },
    { column: 0, row: 0, horizontal: false, length: 10 },
    { column: 0, row: 10, horizontal: true, length: 10 },
    { column: 10, row: 0, horizontal: false, length: 10 },
  
    // Horizontal lines in 1st column
    { column: 0, row: 1, horizontal: true, length: 1 },
    { column: 0, row: 2, horizontal: true, length: 1 },
    { column: 0, row: 7, horizontal: true, length: 1 },

    // Horizontal lines in 2nd column
    { column: 1, row: 1, horizontal: true, length: 1 },
    { column: 1, row: 2, horizontal: true, length: 1 },
    { column: 1, row: 6, horizontal: true, length: 1 },
    { column: 1, row: 9, horizontal: true, length: 1 },

    // Horizontal lines in 3rd column
    { column: 2, row: 1, horizontal: true, length: 1 },
    { column: 2, row: 4, horizontal: true, length: 1 },
    { column: 2, row: 6, horizontal: true, length: 1 },
    { column: 2, row: 9, horizontal: true, length: 1 },

    // Horizontal lines in 4th column
    { column: 3, row: 3, horizontal: true, length: 1 },
    { column: 3, row: 7, horizontal: true, length: 1 },
    { column: 3, row: 9, horizontal: true, length: 1 },

    // Horizontal lines in 5th column
    { column: 4, row: 3, horizontal: true, length: 1 },
    { column: 4, row: 8, horizontal: true, length: 1 },

    // Horizontal lines in 6st column
    { column: 5, row: 2, horizontal: true, length: 1 },
    { column: 5, row: 7, horizontal: true, length: 1 },

    // Horizontal lines in 7th column
    { column: 6, row: 1, horizontal: true, length: 1 },
    { column: 6, row: 2, horizontal: true, length: 1 },
    { column: 6, row: 6, horizontal: true, length: 1 },

    // Horizontal lines in 8th column
    { column: 7, row: 3, horizontal: true, length: 1 },
    { column: 7, row: 6, horizontal: true, length: 1 },
    { column: 7, row: 7, horizontal: true, length: 1 },

    // Horizontal lines in 9th column
    { column: 8, row: 1, horizontal: true, length: 1 },
    { column: 8, row: 4, horizontal: true, length: 1 },
    { column: 8, row: 7, horizontal: true, length: 1 },

    // Horizontal lines in 10th column
    { column: 9, row: 4, horizontal: true, length: 1 },
    { column: 9, row: 9, horizontal: true, length: 1 },

    // Vertical lines in 1st row
    { column: 5, row: 0, horizontal: false, length: 1 },
    { column: 8, row: 0, horizontal: false, length: 1 },

    // Vertical lines in 2nd row
    { column: 3, row: 1, horizontal: false, length: 1 },
    { column: 5, row: 1, horizontal: false, length: 1 },
    { column: 7, row: 1, horizontal: false, length: 1 },
    { column: 9, row: 1, horizontal: false, length: 1 },

    // Vertical lines in 3rd row
    { column: 3, row: 2, horizontal: false, length: 1 },
    { column: 7, row: 2, horizontal: false, length: 1 },

    // Vertical lines in 4th row
    { column: 2, row: 3, horizontal: false, length: 1 },
    { column: 3, row: 3, horizontal: false, length: 1 },
    { column: 7, row: 3, horizontal: false, length: 1 },
    { column: 9, row: 3, horizontal: false, length: 1 },

    // Vertical lines in 5th row
    { column: 4, row: 4, horizontal: false, length: 1 },
    { column: 8, row: 4, horizontal: false, length: 1 },

    // Vertical lines in 6st row
    { column: 1, row: 5, horizontal: false, length: 1 },
    { column: 8, row: 5, horizontal: false, length: 1 },
    { column: 9, row: 5, horizontal: false, length: 1 },

    // Vertical lines in 7th row
    { column: 1, row: 6, horizontal: false, length: 1 },
    { column: 3, row: 6, horizontal: false, length: 1 },
    { column: 5, row: 6, horizontal: false, length: 1 },
    { column: 6, row: 6, horizontal: false, length: 1 },
    { column: 9, row: 6, horizontal: false, length: 1 },

    // Vertical lines in 8th row
    { column: 7, row: 7, horizontal: false, length: 1 },

    // Vertical lines in 9th row
    { column: 1, row: 8, horizontal: false, length: 1 },
    { column: 4, row: 8, horizontal: false, length: 1 },
    { column: 5, row: 8, horizontal: false, length: 1 },
    { column: 7, row: 8, horizontal: false, length: 1 },
    { column: 8, row: 8, horizontal: false, length: 1 },

    // Vertical lines in 10th row
    { column: 8, row: 9, horizontal: false, length: 1 },
].map((wall) => ({
    x: wall.column * (pathWidth + wallWidth),
    y: wall.row * (pathWidth + wallWidth),
    horizontal: wall.horizontal,
    length: wall.length * (pathWidth + wallWidth),
}));

walls.forEach(({ x, y, horizontal, length }) => {
    const wall = document.createElement("div");
    wall.setAttribute("class", "wall");
    wall.style.left = `${x}px`;
    wall.style.top = `${y}px`;
    wall.style.width = `${wallWidth}px`;
    wall.style.height = `${length}px`;
    // In case it is a horizontal wall, rotate it
    wall.style.transform = `rotate(${horizontal ? -90 : 0}deg)`;

    mazeElement.appendChild(wall);
});