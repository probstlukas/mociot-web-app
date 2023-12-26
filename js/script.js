/**
 * MoCIoT Web App: Ball Maze Game
 * 
 * This script provides the core functionality for a ball maze game. The game consists of a maze with walls and paths, 
 * where the player tilts their device to navigate balls through the maze towards a designated target. The script handles 
 * the rendering of the maze, ball movement based on device orientation, collision detection with maze walls, and game state management.
 * 
 * Key Features:
 *   - Device orientation detection to control ball movement.
 *   - Collision detection with walls.
 *   - Game state management for start, reset, and win conditions.
 * 
 * Dependencies:
 *   - Assumes the presence of an HTML structure with specific IDs for the maze and UI elements.
 *   - Relies on external CSS for styling of the maze, walls, and balls.
 *   - Uses modern JavaScript ES6 features and may require a polyfill for compatibility with older browsers.
 * 
 * Assumptions:
 *   - The device has hardware support for orientation detection.
 *   - The browser has permission to access the device's orientation sensors.
 */

const mazeElement = document.getElementById("maze");
// Note element for instructions and game won, game failed texts
const noteElement = document.getElementById("note");

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

/**
 * Defines a Math.minmax function that clamps a value within a symmetric range around zero.
 * This function ensures that the given value does not exceed the specified limit or its negative.
 *
 * @param {number} value - The value to be clamped.
 * @param {number} limit - The upper and lower symmetric limit for the clamping.
 * @returns {number} The clamped value, which is within the range [-limit, limit].
 */
Math.minmax = (value, limit) => {
    return Math.max(Math.min(value, limit), -limit);
};

/**
 * Calculates the Euclidean distance between two points in 2D space.
 * 
 * @param {Object} p1 - The first point with properties x and y.
 * @param {Object} p2 - The second point with properties x and y.
 * @returns {number} The Euclidean distance between point p1 and p2.
 */
const distance2D = (p1, p2) => {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
};

/**
 * Calculates the angle between two points in a 2D space.
 * This function computes the angle in radians between a line connecting two points (p1, p2) and the x-axis.
 * The angle is calculated using the arctangent of the slope of the line.
 * Adjustments are made to ensure the correct angle is returned when the second point lies to the left of the first point.
 * 
 * @param {Object} p1 - The first point, with properties 'x' and 'y'.
 * @param {Object} p2 - The second point, with properties 'x' and 'y'.
 * @returns {number} The angle in radians between the line connecting p1 and p2 and the x-axis.
 */
const getAngle = (p1, p2) => {
    let angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));
    if (p2.x - p1.x < 0) angle += Math.PI;
    return angle;
};

/**
 * Calculates the closest point a ball can be to a wall cap within the maze.
 * This function determines the nearest position a ball can occupy relative to a wall cap without overlapping it,
 * based on their respective sizes and the angle between them. The calculation involves finding the point on the 
 * perimeter of an imaginary circle around the wall cap, which represents the closest approach of the ball's center.
 * 
 * @param {Object} cap - The wall cap, with properties 'x' and 'y' representing its coordinates.
 * @param {Object} ball - The ball, with properties 'x' and 'y' representing its current coordinates.
 * @returns {Object} An object containing the 'x' and 'y' coordinates of the closest point the ball can be to the wall cap.
 */
const closestItCanBe = (cap, ball) => {
    let angle = getAngle(cap, ball);

    const deltaX = Math.cos(angle) * (wallWidth / 2 + ballSize / 2);
    const deltaY = Math.sin(angle) * (wallWidth / 2 + ballSize / 2);

    return { x: cap.x + deltaX, y: cap.y + deltaY };
};

/**
 * Determines the new position and velocity of a ball as it rolls around a wall cap.
 * This function is used to simulate the rolling motion of a ball when it comes into contact with the end cap of a wall.
 * It calculates the ball's new position and adjusted velocity based on its collision with the cap. 
 * The calculations take into account the direction of the ball's impact, its intended heading, and the resulting angle 
 * of deflection. The function also considers the velocity magnitude and how it is affected by the impact.
 * 
 * @param {Object} cap - The wall cap, with properties 'x' and 'y' representing its coordinates.
 * @param {Object} ball - The ball, with properties 'x', 'y', 'velocityX', and 'velocityY'.
 * @returns {Object} An object containing the new position ('x', 'y') and velocity ('velocityX', 'velocityY') of the ball,
 *                   as well as the next anticipated position ('nextX', 'nextY').
 */
const rollAroundCap = (cap, ball) => {
    // The direction the ball can't move any further because the wall holds it back
    let impactAngle = getAngle(ball, cap);

    // The direction the ball wants to move based on it's velocity
    let heading = getAngle(
        { x: 0, y: 0 },
        { x: ball.velocityX, y: ball.velocityY }
    );

    /*
    The angle between the impact direction and the ball's desired direction.
    The smaller this angle is, the bigger the impact.
    The closer it is to 90 degrees the smoother it gets (at 90 there would be no collision).
    */
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

/**
 * Reduces the absolute value of a number while preserving its sign, without going below zero.
 * This function is used to gradually decrease a numeric value (such as velocity) over time, simulating a slowing effect.
 * It decreases the number by a specified 'difference' value, but ensures that the number does not cross zero and flip sign.
 * The function is particularly useful in scenarios where a gradual deceleration or fade-out effect is required.
 * 
 * @param {number} number - The original number to be slowed down.
 * @param {number} difference - The amount by which the number should be reduced.
 * @returns {number} The slowed down value of the original number.
 */
const slow = (number, difference) => {
    if (Math.abs(number) <= difference) return 0;
    if (number > difference) return number - difference;
    return number + difference;
};

/* LAYOUT */

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

/* ACCELEROMETER LOGIC */

/**
 * Handles the device's orientation events to determine the movement of the ball in the maze.
 * This function is triggered by the device's orientation sensors, specifically responding to changes in tilt.
 * It calculates the rotation of the maze element based on the left/right (gamma) and front/back (beta) tilt of the device.
 * Additionally, it computes the acceleration and friction applied to the ball due to the device's tilt, simulating gravity.
 * These calculations are used to update the game state in the subsequent frame of the game loop.
 * 
 * @param {Object} event - The device orientation event containing information about the device's tilt.
 *                          'gamma' represents the left/right tilt, and 'beta' represents the front/back tilt.
 */
function handleDeviceOrientation(event) {
    // Left/Right tilt in degrees
    var tiltLR = event.gamma;
    // Front/Back tilt in degrees
    var tiltFB = event.beta;

    var rotationFactor = 0.8;

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

/**
 * Requests permission to access motion and orientation data on devices, especially iOS devices.
 * This function checks if the DeviceMotionEvent.requestPermission method is available, which is
 * particularly relevant for iOS devices starting from iOS 13, where permission is required to access device motion and orientation.
 * If permission is required and granted, it adds an event listener for device orientation changes.
 * If permission is not granted, it alerts the user. On non-iOS devices or older iOS versions, it directly adds the event listener.
 */
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

/**
 * The main game loop function, responsible for updating the game state in each frame.
 * It calculates the movement of balls based on the current tilt of the device and applies physics, such as gravity and friction.
 * The function handles collision detection with walls, updates ball positions, and checks for win conditions.
 * If the game is in progress, it requests the next animation frame to continue the game loop.
 * 
 * @param {number} timestamp - The timestamp of the current frame, provided by requestAnimationFrame.
 */
function main(timestamp) {
    // It is possible to reset the game mid-game
    if (!gameInProgress) return;

    if (previousTimestamp === undefined) {
        previousTimestamp = timestamp;
        window.requestAnimationFrame(main);
        return;
    }

    const maxVelocity = 0.25;

    /*
    Calculates the time elapsed since the last update cycle in terms of 'frame units'.
    Dividing the actual time elapsed (in ms) by 16 normalizes the value, so that
    a value of 1 represents the expected duration of a single frame (16 ms).
    */
    const timeElapsed = (timestamp - previousTimestamp) / 16;
    
    if (accelerationX != undefined && accelerationY != undefined) {
        const velocityChangeX = accelerationX * timeElapsed;
        const velocityChangeY = accelerationY * timeElapsed;
        const frictionDeltaX = frictionX * timeElapsed;
        const frictionDeltaY = frictionY * timeElapsed;

        balls.forEach((ball) => {
            if (velocityChangeX == 0) {
                /* 
                No rotation, the plane is flat.
                On flat surface friction can only slow down, but not reverse movement.
                */
                ball.velocityX = slow(ball.velocityX, frictionDeltaX);
            } else {
                ball.velocityX = ball.velocityX + velocityChangeX;
                ball.velocityX = Math.max(Math.min(ball.velocityX, 1.5), -1.5);
                ball.velocityX = ball.velocityX - Math.sign(velocityChangeX) * frictionDeltaX;
                ball.velocityX = Math.minmax(ball.velocityX, maxVelocity);
            }

            if (velocityChangeY == 0) {
                /*
                No rotation, the plane is flat.
                On flat surface friction can only slow down, but not reverse movement.
                */
                ball.velocityY = slow(ball.velocityY, frictionDeltaY);
            } else {
                ball.velocityY = ball.velocityY + velocityChangeY;
                ball.velocityY =
                    ball.velocityY - Math.sign(velocityChangeY) * frictionDeltaY;
                ball.velocityY = Math.minmax(ball.velocityY, maxVelocity);
            }

            /*
            Preliminary next ball position, only becomes true if no hit occurs.
            Used only for hit testing, does not mean that the ball will reach this position.
            */
            ball.nextX = ball.x + ball.velocityX;
            ball.nextY = ball.y + ball.velocityY;

            walls.forEach((wall) => {
                if (wall.horizontal) {
                    // Horizontal wall
                    if (
                        ball.nextY + ballSize / 2 >= wall.y - wallWidth / 2 &&
                        ball.nextY - ballSize / 2 <= wall.y + wallWidth / 2
                    ) {
                        /*
                        Ball got within the strip of the wall.
                        (not necessarily hit it, could be before or after).
                        */

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
                        /*
                        Ball got within the strip of the wall.
                        (not necessarily hit it, could be before or after).
                        */
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
