//(function () {

//--------------------------------------------//
//                 VARIABLES                  //
//--------------------------------------------// 

// Main container 
const app = document.getElementById('pixelPainter');

// Tracks 'click and hold' for the puporse of continuous 
// 'paint brush' effect
let mousedown = false;

// Current active color and paint tool
let activeColor = "#fff";
let activeTool = "brush";

// Array of swatch colors
const colors = [
  "#ef5f1e",
  "#f8952d",
  "#f7c366",
  "#33c222",
  "#9eef36",
  "#fbf96a",
  "#1682fb",
  "#5abcfa",
  "#b1defb",
  "#d366f9",
  "#fcabdb",
  "#a86922",
  "#000100",
  "#6e706d",
  "#f9fafa"
];

// Array to hold save state data
let saveState = [];

// FILL VARIABLES
// Current working pixel
// Event target color
// Array of reference coordinates 
// Variable to prevent unnecessary function execution
// Reference arrays to check Left and Right edges of canvas
let currentPixel = 0;
let target;
let pixelStack = [];
let exit = false;
let markLeft = true;
let markRight = true;
const edgeL = [];
const edgeR = [];

//--------------------------------------------//
//              MAIN FUNCTIONS                //
//--------------------------------------------// 

//Utility function for creating a grid
// creates a new div to hold grid and assigns a class
// based on the provided height, will create a div for each row
// based on the width will create a div for each pixel in the row
// assigns appropriate classes and ids
// appends pixels to rows, then rows to grid and returns the grid element
const generateGrid = (height, width) => {
  let grid = document.createElement('div');
  grid.className = "grid";
  for (let y = 0; y < height; y++) {
    let row = document.createElement('div');
    row.className = "row";
    row.id = y;
    for (let x = 0; x < width; x++) {
      let pixel = document.createElement('div');
      pixel.className = 'pixel';
      row.appendChild(pixel);
    }
    grid.appendChild(row);
  }
  return grid;
};

// loops over all swatch colors and removes the 'selected' class
const deselectColors = () => {
  for (let x = 0; x < swatches.length; x++) {
    swatches[x].classList.remove('selected');
  }
};

// loops over all pixels on canvas and resets background to white
const clearCanvas = () => {
  for (let i = 0; i < pixels.length; i++) {
    pixels[i].style.background = "#fff";
  }
};

// removes 'selected' stylings of all tool buttons
const deselectTools = () => {
  brushButton.classList.remove('selected');
  bucketButton.classList.remove('selected');
  eraseButton.classList.remove('selected');
}

//--------------------------------------------//
//                    SAVE                    //
//--------------------------------------------// 

// Pushes background color data of all pixels into saveState array in order
const saveCurrentState = () => {
  saveState = [];
  for (let i = 0; i < pixels.length; i++) {
    saveState.push(pixels[i].style.background);
  }
};
// Assigns all background color data from saveState array to respective pixels on canvas
const loadSaveState = () => {
  for (let i = 0; i < pixels.length; i++) {
    if (saveState.length > 0) {
      pixels[i].style.background = saveState[i];
    }
  }
};

//--------------------------------------------//
//                PAGE BUILD                  //
//--------------------------------------------// 

// Constructs 2 grids to hold canvas and swatch
const canvas = generateGrid(32, 32);
const swatch = generateGrid(1, 15);

// Creates necessary elements and container divs
const artboard = document.createElement('div');
const toolkit = document.createElement('div');
const saveConsole = document.createElement('div');
const brushButton = document.createElement('button');
const bucketButton = document.createElement('button');
const eraseButton = document.createElement('button');
const clearButton = document.createElement('button');
const saveButton = document.createElement('button');
const loadButton = document.createElement('button');

// Assigns appropriate ids and text content
clearButton.textContent = "CLEAR";
eraseButton.textContent = "Eraser";
brushButton.textContent = "Brush";
bucketButton.textContent = "Bucket";
saveButton.textContent = "Save";
loadButton.textContent = "Load";
artboard.id = "artboard";
toolkit.id = "toolkit";
saveConsole.id = "saveConsole";
brushButton.id = "brush";
brushButton.classList.add('selected');
bucketButton.id = "bucket";
eraseButton.id = "erase";
clearButton.id = "clear";
saveButton.id = "save";
loadButton.id = "load";
canvas.id = "canvas";
swatch.id = "swatch";

// Appends elements to the proper parent element
toolkit.appendChild(brushButton);
toolkit.appendChild(bucketButton);
toolkit.appendChild(eraseButton);
toolkit.appendChild(clearButton);
saveConsole.appendChild(saveButton);
saveConsole.appendChild(loadButton);
artboard.appendChild(canvas);
artboard.appendChild(swatch);
artboard.appendChild(toolkit);
artboard.appendChild(saveConsole);
app.appendChild(artboard);


// Puts all swatch colors and canvas pixels in respective collections
const swatches = document.querySelectorAll('#swatch .pixel');
const pixels = document.querySelectorAll('#canvas .pixel');

// Loops over all canvas pixels and assigns 'canvas' class
// for the purpose of click events and attaches coordinates
for (let i = 0; i < pixels.length; i++) {
  pixels[i].id = i
  pixels[i].classList.add('canvas');
  pixels[i].style.background = "rgb(255, 255, 255)";
  pixels[i].draggable = false;
};

// Loops over all swatches 
// Assigns background color to each based on 'colors' array
// Adds an event listener to each
// When clicked, deselects all colors & eraser button, 
// assigns the target element the 'selected' class,
// and updates active color
for (let i = 0; i < swatches.length; i++) {
  swatches[i].style.background = colors[i];
  swatches[i].id = colors[i]
  swatches[i].addEventListener('click', (e) => {
    deselectTools();
    deselectColors();
    swatches[i].classList.add('selected');
    activeColor = e.target.id;
    if (activeTool === "eraser" || activeTool === "brush") {
      brushButton.classList.add('selected');
      activeTool = "brush";
    } else {
      activeTool = "bucket"
      bucketButton.classList.add('selected');
    }
  });
}

//--------------------------------------------//
//                    FILL                    //
//--------------------------------------------// 

// FINDS TOP BOUNDARY OF TARGET NODE
// parses id string into number data which represents index of 'pixels' array
// indexes for current pixel and next pixel are stored in variables
// while index is greater than zero (or on canvas) 
//if the next pixels background matches the target color
//if the pixel after next is outside of canvas, return next pixel as boundary
// if not, move up and repeat
// if pixel does NOT match target color, return current pixel as boundary
// if in the beginning, next pixel is outside the canvas, return starting boundary
const findTopBoundary = (id) => {
  //debugger;
  let nextPixel = parseInt(id) - 32;
  let boundary = parseInt(id);
  while (nextPixel > 0) {
    if (pixels[nextPixel].style.background === target) {
      if (nextPixel - 32 < 0) {
        return boundary - 32;
      } else {
        nextPixel -= 32;
        boundary -= 32;
      }
    } else {
      return boundary;
    }
  }
  return boundary;
};

// Dynamically populates 'edgeL' array with all indexes of left edge pixels
for (let i = 0; i < 993; i += 32) {
  edgeL.push(i);
};

// CHECKS FOR OPEN SPACES TO LEFT OF PIXEL IN CURRENT ITERATION
// parses id string into number
// assigns pixel to be checked to 'checking' variable
// if the pixel being checked exists and is not on the next line on right edge
// if pixel being checked matches target color
// add pixel to pixelStack
const checkLeft = (id) => {
  //debugger;
  let newID = parseInt(id) - 1;
  let checking = pixels[newID];
  if (checking && !edgeR.includes(newID)) {
    if (checking.style.background === target) {
      if (markLeft === true) {
        pixelStack.push(checking.id);
        markLeft = false;
      }
    } else if (checking.style.background !== target) {
      markLeft = true;
    }
  }
};

// Dynamically populates 'edgeR' array with all indexes of right edge pixels
for (let i = 31; i < pixels.length + 1; i += 32) {
  edgeR.push(i);
};

// CHECKS FOR OPEN SPACES TO RIGHT OF PIXEL IN CURRENT ITERATION
// parses id string into number
// assigns pixel to be checked to 'checking' variable
// if the pixel being checked exists and is not on the next line on left edge
// if pixel being checked matches target color
// add pixel to pixelStack
const checkRight = (id) => {
  let newID = parseInt(id) + 1;
  let checking = pixels[newID];
  if (checking && !edgeL.includes(newID)) {
    if (checking.style.background === target) {
      if (markRight === true) {
        pixelStack.push(checking.id);
        markRight = false;
      }
    } else if (checking.style.background !== target) {
      markRight = true;
    }
  }
};

// FILLS ALL BOXES FROM TOP BOUNDARY DOWN TO BOTTOM BOUNDARY
// iterates over all pixels in a vertical column starting from top boundary
// if pixel is between top and bottom boundary, fill pixel and floodFill next pixel in stack
// else if pixel matches target color, fill pixel 
// if 'exit' variable is 'true', stop function execution, else check left and right pixels and start new iteration
// if pixel does not match target color, floodFill next pixel in stack
const fillToBottomBoundary = (topBoundary) => {
  for (let i = topBoundary; i < pixels.length; i += 32) {
    if (i + 32 > pixels.length && pixels[i].style.background === target) {
      pixels[i].style.background = activeColor;
      checkLeft();
      checkRight();
      floodFill();
    } else if (pixels[i].style.background === target) {
      pixels[i].style.background = activeColor;
    } else {
      floodFill();
    }
    if (exit === true) {
      return;
    } else {
      checkLeft(i);
      checkRight(i);
    }
  }
};

// FILLS ALL MATCHING PIXELS IN A NODE WITHIN BOUNDS OF NON-MATCHING PIXELS
// if there is a pixel in the pixel stack, grab the last one out of it
// finds the top boundary of the reference pixel
// starting from top boundary of reference pixels column, fill every pixel below it until bottom boundary
// open pixels on sides are added to pixel stack
// repeats until all pixels in node are filled
// if pixel stack is empty set exit variable to true
const floodFill = () => {
  if (pixelStack.length > 0) {
    currentPixel = pixelStack.pop();
    let topBoundary = findTopBoundary(currentPixel);
    markLeft = true;
    markRight = true;
    fillToBottomBoundary(topBoundary);
  } else {
    exit = true;
  }
};

//--------------------------------------------//
//              EVENT LISTENERS               //
//--------------------------------------------//     

// Resets entire page; canvas, selected color, and active color 
clearButton.addEventListener('click', () => {
  clearCanvas();
  deselectColors();
  deselectTools();
  brushButton.classList.add('selected');
  activeTool = "brush";
  activeColor = "#fff";
});

// Activate eraser and deselects swatch colors
eraseButton.addEventListener('click', () => {
  activeColor = "#fff";
  deselectColors();
  deselectTools();
  eraseButton.classList.add('selected');
  activeTool = "eraser";
});

// Deselects all tools
// adds 'selected' stylings to brush button
// sets brush as active tool
brushButton.addEventListener('click', () => {
  deselectTools();
  brushButton.classList.add('selected');
  activeTool = "brush"
});

// Deselects all tools
// adds 'selected' stylings to bucket button
// sets bucket as active tool
bucketButton.addEventListener('click', () => {
  deselectTools();
  bucketButton.classList.add('selected');
  activeTool = "bucket"
});

// Adds an event listener to entire document
// If anywhere on the document is clicked, checks the target elements classlist 
// if it contains the canvas class & active tool is brush or eraser
// assigns active color to pixel
// if it contains canvas class & active tool is bucket
// adds pixel to pixel stack as first reference coordinate and runs 'floodFill'
// resets 'exit' variable to 'false'
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('canvas')) {
    if (activeTool === "brush" || activeTool === "eraser") {
      e.target.style.background = activeColor;
    } else {
      pixelStack.push(e.target.id);
      floodFill();
      exit = false;
    }
  }
});

// Tracks when mouse is clicked down
document.addEventListener('mousedown', (e) => {
  mousedown = true;
  if (e.target.classList.contains('canvas')) {
    target = e.target.style.background;
    if (activeTool === "brush" || activeTool === "eraser") {
      e.target.style.background = activeColor;
    }
  }
});

// Tracks when mouse click is released
document.addEventListener('mouseup', () => {
  mousedown = false;
});

// As long as mouse is held down, 'mousedown' variable will be true
// As long as 'mousedown' is true and the event target has correct 
// class, background color will change
document.addEventListener('mouseover', (e) => {
  if (activeTool !== "bucket") {
    if (mousedown === true && e.target.classList.contains('canvas')) {
      e.target.style.background = activeColor;
    }
  }
});

// Saves canvas in memory when save button clicked
saveButton.addEventListener('click', () => {
  saveCurrentState();
});

// Loads canvas from memory when load button clicked
loadButton.addEventListener('click', () => {
  loadSaveState();
});

//})();

