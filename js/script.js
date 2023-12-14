// TODO: Clarify comments and use consistent type of comments

const mazeElement = document.getElementById("maze");
const noteElement = document.getElementById("note"); // Note element for instructions and game won, game failed texts

let previousTimestamp;
let gameInProgress;
let accelerationX;
let accelerationY;
let frictionX;
let frictionY;

const pathWidth = 30;
const wallWidth = 10;
const ballSize = 10; // Width and height of the ball

let balls = [];
let ballElements = [];

// Reset game at the beginning
resetGame();

/* 
Defines a Math.minmax function that clamps a value within a symmetric range around zero.
This function ensures that the given value does not exceed the specified limit or its negative.
*/
Math.minmax = (value, limit) => {
    return Math.max(Math.min(value, limit), -limit);
};

// Caculates distance with 2 dimensions
const distance2D = (p1, p2) => {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
};

// Angle between the two points
const getAngle = (p1, p2) => {
    let angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));
    if (p2.x - p1.x < 0) angle += Math.PI;
    return angle;
};

// The closest a ball and a wall cap can be
const closestItCanBe = (cap, ball) => {
    let angle = getAngle(cap, ball);

    const deltaX = Math.cos(angle) * (wallWidth / 2 + ballSize / 2);
    const deltaY = Math.sin(angle) * (wallWidth / 2 + ballSize / 2);

    return { x: cap.x + deltaX, y: cap.y + deltaY };
};

// Roll the ball around the wall cap
const rollAroundCap = (cap, ball) => {
    // The direction the ball can't move any further because the wall holds it back
    let impactAngle = getAngle(ball, cap);

    // The direction the ball wants to move based on it's velocity
    let heading = getAngle(
        { x: 0, y: 0 },
        { x: ball.velocityX, y: ball.velocityY }
    );

    // The angle between the impact direction and the ball's desired direction
    // The smaller this angle is, the bigger the impact
    // The closer it is to 90 degrees the smoother it gets (at 90 there would be no collision)
    let impactHeadingAngle = impactAngle - heading;

    // Velocity distance if not hit would have occurred
    const velocityMagnitude = distance2D(
        { x: 0, y: 0 },
        { x: ball.velocityX, y: ball.velocityY }
    );
    // Velocity component diagonal to the impact
    const velocityMagnitudeDiagonalToTheImpact =
        Math.sin(impactHeadingAngle) * velocityMagnitude;

    // How far should the ball be from the wall cap
    const closestDistance = wallWidth / 2 + ballSize / 2;

    const rotationAngle = Math.atan(
        velocityMagnitudeDiagonalToTheImpact / closestDistance
    );

    const deltaFromCap = {
        x: Math.cos(impactAngle + Math.PI - rotationAngle) * closestDistance,
        y: Math.sin(impactAngle + Math.PI - rotationAngle) * closestDistance
    };

    const x = ball.x;
    const y = ball.y;
    const velocityX = ball.x - (cap.x + deltaFromCap.x);
    const velocityY = ball.y - (cap.y + deltaFromCap.y);
    const nextX = x + velocityX;
    const nextY = y + velocityY;

    return { x, y, velocityX, velocityY, nextX, nextY };
};

// Decreases the absolute value of a number but keeps it's sign, doesn't go below abs 0
const slow = (number, difference) => {
    if (Math.abs(number) <= difference) return 0;
    if (number > difference) return number - difference;
    return number + difference;
};

/* Layout */

// Draw balls at the beginning
balls.forEach(({ x, y }) => {
    const ball = document.createElement("div");
    ball.setAttribute("class", "ball");
    ball.style.left = `${x}px`;
    ball.style.top = `${y}px`;

    mazeElement.appendChild(ball);
    ballElements.push(ball);
});

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

// Draw walls
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

/* Accelerometer logic */

// var lastTiltLR = 0;
// var lastTiltFB = 0;
// var smoothingFactor = 0.1; // Adjust this value based on testing
/*
Determines the ball's movement based on the device's tilt
*/
function handleDeviceOrientation(event) {
    var tiltLR = event.gamma; // Left/Right tilt in degrees
    var tiltFB = event.beta;  // Front/Back tilt in degrees

    // tiltLR = tiltLR * smoothingFactor + lastTiltLR * (1 - smoothingFactor);
    // tiltFB = tiltFB * smoothingFactor + lastTiltFB * (1 - smoothingFactor);

    // lastTiltLR = tiltLR;
    // lastTiltFB = tiltFB;

    // Sensitivity factor for tilt
    // var sensitivity = 0.5; // Adjust this value based on testing
    var rotationFactor = 0.8; // Adjust this value based on testing

    // Calculate acceleration based on tilt
    // accelerationX = tiltLR * sensitivity;
    // accelerationY = tiltFB * sensitivity;

    // Calculate rotation based on tilt
    const rotationY = tiltLR * rotationFactor;
    const rotationX = tiltFB * rotationFactor;

    // Apply rotation to the maze element
    if (mazeElement) {
        mazeElement.style.cssText = `transform: rotateY(${rotationY}deg) rotateX(${-rotationX}deg)`;
    }

    // Gravity and friction
    const gravity = 0.1; // Gravity factor
    const friction = 0.001; // Coefficients of friction

    // Calculate friction based on tilt
    accelerationX = gravity * Math.sin((rotationY / 180) * Math.PI);
    accelerationY = gravity * Math.sin((rotationX / 180) * Math.PI);
    frictionX = gravity * Math.cos((rotationY / 180) * Math.PI) * friction;
    frictionY = gravity * Math.cos((rotationX / 180) * Math.PI) * friction;

    // Proceed to the next frame of the game loop
    window.requestAnimationFrame(main);
}

/* Requesting permissions to access motion and orientation on iOS devices */
function getAccel() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleDeviceOrientation);
                } else {
                    alert("Accelerometer permission not granted.");
                }
            })
            .catch(console.error);
    } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
}

/* 
Event listener for DOMContentLoaded ensures that the script runs after the entire HTML document is loaded.
This setup is necessary to ensure that all elements are available for JavaScript to attach event listeners.
*/
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('accelPermsButton').addEventListener('click', getAccel);

    // Event listener for the 'Start' button
    document.getElementById('start').addEventListener('click', function () {
        startGame();
    });

    // Event listener for the 'Reset' button
    document.getElementById('reset').addEventListener('click', function () {
        resetGame();
    });
});

/**
 * Starts the game by setting the game state to in progress and initiating the game loop.
 * This function is called when the 'Start' button is clicked.
 * It sets the gameInProgress flag to true and triggers the main game loop using requestAnimationFrame.
 * Additionally, it hides the note element to clear the game instructions or messages from the screen.
 */
function startGame() {
    if (!gameInProgress) {
        gameInProgress = true;
        window.requestAnimationFrame(main);
        noteElement.style.opacity = 0.5;    
        noteElement.innerHTML = "Good luck! <p><b>Hint:</b> it's easier to unite the balls first.</p>";
    }
}

/**
 * Resets the game to its initial state.
 * This function is called when the 'Reset' button is clicked.
 * It resets the time, game progress flags, acceleration, friction variables, and maze element's transformation.
 * It also resets the instruction note's content and visibility and reinitializes the positions of the balls
 * in the maze to their starting locations.
 */
function resetGame() {
    previousTimestamp = undefined;
    gameInProgress = false;
    accelerationX = undefined;
    accelerationY = undefined;
    frictionX = undefined;
    frictionY = undefined;

    mazeElement.style.cssText = `transform: rotateY(0deg) rotateX(0deg)`;

    noteElement.innerHTML = "Move every ball to the center to win the game.";
    noteElement.style.opacity = 1;

    // Balls in the maze
    balls = [
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

    if (ballElements.length) {
        balls.forEach(({ x, y }, index) => {
            ballElements[index].style.left = `${x}px`;
            ballElements[index].style.top = `${y}px`;
        });
    }
}

function main(timestamp) {
    // It is possible to reset the game mid-game
    if (!gameInProgress) return;

    if (previousTimestamp === undefined) {
        previousTimestamp = timestamp;
        window.requestAnimationFrame(main);
        return;
    }

    const maxVelocity = 0.5;

    // Calculates the time elapsed since the last update cycle in terms of 'frame units'.
    // Dividing the actual time elapsed (in ms) by 16 normalizes the value, so that
    // a value of 1 represents the expected duration of a single frame (16 ms).
    const timeElapsed = (timestamp - previousTimestamp) / 16;
    
    if (accelerationX != undefined && accelerationY != undefined) {
        const velocityChangeX = accelerationX * timeElapsed;
        const velocityChangeY = accelerationY * timeElapsed;
        const frictionDeltaX = frictionX * timeElapsed;
        const frictionDeltaY = frictionY * timeElapsed;

        balls.forEach((ball) => {
            if (velocityChangeX == 0) {
                // No rotation, the plane is flat
                // On flat surface friction can only slow down, but not reverse movement
                ball.velocityX = slow(ball.velocityX, frictionDeltaX);
            } else {
                ball.velocityX = ball.velocityX + velocityChangeX;
                ball.velocityX = Math.max(Math.min(ball.velocityX, 1.5), -1.5);
                ball.velocityX = ball.velocityX - Math.sign(velocityChangeX) * frictionDeltaX;
                ball.velocityX = Math.minmax(ball.velocityX, maxVelocity);
            }

            if (velocityChangeY == 0) {
                // No rotation, the plane is flat
                // On flat surface friction can only slow down, but not reverse movement
                ball.velocityY = slow(ball.velocityY, frictionDeltaY);
            } else {
                ball.velocityY = ball.velocityY + velocityChangeY;
                ball.velocityY =
                    ball.velocityY - Math.sign(velocityChangeY) * frictionDeltaY;
                ball.velocityY = Math.minmax(ball.velocityY, maxVelocity);
            }

            // Preliminary next ball position, only becomes true if no hit occurs
            // Used only for hit testing, does not mean that the ball will reach this position
            ball.nextX = ball.x + ball.velocityX;
            ball.nextY = ball.y + ball.velocityY;

            walls.forEach((wall) => {
                if (wall.horizontal) {
                    // Horizontal wall
                    if (
                        ball.nextY + ballSize / 2 >= wall.y - wallWidth / 2 &&
                        ball.nextY - ballSize / 2 <= wall.y + wallWidth / 2
                    ) {
                        // Ball got within the strip of the wall
                        // (not necessarily hit it, could be before or after)

                        const wallStart = {
                            x: wall.x,
                            y: wall.y,
                        };
                        const wallEnd = {
                            x: wall.x + wall.length,
                            y: wall.y,
                        };

                        if (
                            ball.nextX + ballSize / 2 >= wallStart.x - wallWidth / 2 &&
                            ball.nextX < wallStart.x
                        ) {
                            // Ball might hit the left cap of a horizontal wall
                            const distance = distance2D(wallStart, {
                                x: ball.nextX,
                                y: ball.nextY,
                            });
                            if (distance < ballSize / 2 + wallWidth / 2) {
                                // Ball hits the left cap of a horizontal wall
                                const closest = closestItCanBe(wallStart, {
                                    x: ball.nextX,
                                    y: ball.nextY,
                                });
                                const rolled = rollAroundCap(wallStart, {
                                    x: closest.x,
                                    y: closest.y,
                                    velocityX: ball.velocityX,
                                    velocityY: ball.velocityY,
                                });

                                Object.assign(ball, rolled);
                            }
                        }

                        if (
                            ball.nextX - ballSize / 2 <= wallEnd.x + wallWidth / 2 &&
                            ball.nextX > wallEnd.x
                        ) {
                            // Ball might hit the right cap of a horizontal wall
                            const distance = distance2D(wallEnd, {
                                x: ball.nextX,
                                y: ball.nextY,
                            });
                            if (distance < ballSize / 2 + wallWidth / 2) {
                                // Ball hits the right cap of a horizontal wall
                                const closest = closestItCanBe(wallEnd, {
                                    x: ball.nextX,
                                    y: ball.nextY,
                                });
                                const rolled = rollAroundCap(wallEnd, {
                                    x: closest.x,
                                    y: closest.y,
                                    velocityX: ball.velocityX,
                                    velocityY: ball.velocityY,
                                });

                                Object.assign(ball, rolled);
                            }
                        }

                        if (ball.nextX >= wallStart.x && ball.nextX <= wallEnd.x) {
                            // The ball got inside the main body of the wall
                            if (ball.nextY < wall.y) {
                                // Hit horizontal wall from top
                                ball.nextY = wall.y - wallWidth / 2 - ballSize / 2;
                            } else {
                                // Hit horizontal wall from bottom
                                ball.nextY = wall.y + wallWidth / 2 + ballSize / 2;
                            }
                            ball.y = ball.nextY;
                            ball.velocityY = -ball.velocityY / 6;
                        }
                    }
                } else {
                    // Vertical wall

                    if (
                        ball.nextX + ballSize / 2 >= wall.x - wallWidth / 2 &&
                        ball.nextX - ballSize / 2 <= wall.x + wallWidth / 2
                    ) {
                        // Ball got within the strip of the wall
                        // (not necessarily hit it, could be before or after)

                        const wallStart = {
                            x: wall.x,
                            y: wall.y,
                        };
                        const wallEnd = {
                            x: wall.x,
                            y: wall.y + wall.length,
                        };

                        if (
                            ball.nextY + ballSize / 2 >= wallStart.y - wallWidth / 2 &&
                            ball.nextY < wallStart.y
                        ) {
                            // Ball might hit the top cap of a horizontal wall
                            const distance = distance2D(wallStart, {
                                x: ball.nextX,
                                y: ball.nextY,
                            });
                            if (distance < ballSize / 2 + wallWidth / 2) {

                                // Ball hits the left cap of a horizontal wall
                                const closest = closestItCanBe(wallStart, {
                                    x: ball.nextX,
                                    y: ball.nextY,
                                });
                                const rolled = rollAroundCap(wallStart, {
                                    x: closest.x,
                                    y: closest.y,
                                    velocityX: ball.velocityX,
                                    velocityY: ball.velocityY,
                                });

                                Object.assign(ball, rolled);
                            }
                        }

                        if (
                            ball.nextY - ballSize / 2 <= wallEnd.y + wallWidth / 2 &&
                            ball.nextY > wallEnd.y
                        ) {
                            // Ball might hit the bottom cap of a horizontal wall
                            const distance = distance2D(wallEnd, {
                                x: ball.nextX,
                                y: ball.nextY,
                            });
                            if (distance < ballSize / 2 + wallWidth / 2) {
                                // Ball hits the right cap of a horizontal wall
                                const closest = closestItCanBe(wallEnd, {
                                    x: ball.nextX,
                                    y: ball.nextY,
                                });
                                const rolled = rollAroundCap(wallEnd, {
                                    x: closest.x,
                                    y: closest.y,
                                    velocityX: ball.velocityX,
                                    velocityY: ball.velocityY,
                                });

                                Object.assign(ball, rolled);
                            }
                        }

                        if (ball.nextY >= wallStart.y && ball.nextY <= wallEnd.y) {
                            // The ball got inside the main body of the wall
                            if (ball.nextX < wall.x) {
                                // Hit vertical wall from left
                                ball.nextX = wall.x - wallWidth / 2 - ballSize / 2;
                            } else {
                                // Hit vertical wall from right
                                ball.nextX = wall.x + wallWidth / 2 + ballSize / 2;
                            }
                            ball.x = ball.nextX;
                            ball.velocityX = -ball.velocityX / 6;
                        }
                    }
                }
            });

            // Adjust ball metadata
            ball.x = ball.x + ball.velocityX;
            ball.y = ball.y + ball.velocityY;
        });

        // Move balls to their new position
        balls.forEach(({ x, y }, index) => {
            ballElements[index].style.left = `${x}px`;
            ballElements[index].style.top =  `${y}px`;
        });
    }

    // Win detection
    if (balls.every((ball) => distance2D(ball, { x: 400 / 2, y: 400 / 2 }) < 75 / 2)) {
        noteElement.innerHTML = "Good job! <p>You managed to get all four balls to the center.</p>";
        noteElement.style.opacity = 1;
        gameInProgress = false;
    } else {
        previousTimestamp = timestamp;
        window.requestAnimationFrame(main);
    }
}
