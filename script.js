$(document).ready(function () {
  var grid = [];
  var currentPiece = {};
  var savedBlock = { shape: [], color: null };
  var isSavedBlockActive = true;
  var nextPiece = null;
  var createdPiceces = 0;
  var score = 0;
  var level = 1;
  var speed = 1000;
  var intervalId;
  var colors = ["yellow", "red", "blue", "purple", "green", "orange", "navy"];

  function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
  }
  function placePiece() {
    if (!grid || !currentPiece || !currentPiece.shape) {
      console.error("placePiece() requires grid, currentPiece, and currentPiece.shape to be set.");
      return;
    }

    $(".tetris-cell").removeClass("filled").css("background-color", "white");

    for (var row = 0; row < grid.length; row++) {
      for (var col = 0; col < grid[row].length; col++) {
        if (grid[row][col]) {
          var $cell = $(".tetris-grid")
            .find(".tetris-cell")
            .eq(row * 10 + col);
          if (!$cell) {
            console.error("Could not find tetris-cell for row: " + row + " col: " + col);
            continue;
          }
          $cell.addClass("filled").css("background-color", grid[row][col]);
        }
      }
    }

    for (var row = 0; row < currentPiece.shape.length; row++) {
      for (var col = 0; col < currentPiece.shape[row].length; col++) {
        if (currentPiece.shape[row][col]) {
          var $cell = $(".tetris-grid")
            .find(".tetris-cell")
            .eq((currentPiece.row + row) * 10 + (currentPiece.col + col));
          if (!$cell) {
            console.error("Could not find tetris-cell for row: " + (currentPiece.row + row) + " col: " + (currentPiece.col + col));
            continue;
          }
          $cell.addClass("filled").css("background-color", currentPiece.color);
        }
      }
    }

    if (savedBlock.color !== null) {
      $(".saved-block-grid").find(".tetris-cell").removeClass("filled").css("background-color", "white");
      for (var row = 0; row < savedBlock.shape.length; row++) {
        for (var col = -1; col < savedBlock.shape[row].length; col++) {
          if (savedBlock.shape[row][col]) {
            var $cell = $(".saved-block-grid")
              .find(".tetris-cell")
              .eq(row * 4 + col);
            if (!$cell) {
              console.error("Could not find tetris-cell for row: " + row + " col: " + col);
              continue;
            }
            $cell.addClass("filled").css("background-color", savedBlock.color); // Kaydedilen bloğu göster.
          }
        }
      }
    }

    if (nextPiece) {
      $(".next-block-grid").find(".tetris-cell").removeClass("filled").css("background-color", "white");
      for (var row = 0; row < nextPiece.shape.length; row++) {
        for (var col = -1; col < nextPiece.shape[row].length; col++) {
          if (nextPiece.shape[row][col]) {
            var $cell = $(".next-block-grid")
              .find(".tetris-cell")
              .eq(row * 4 + col);
            if (!$cell) {
              console.error("Could not find tetris-cell for row: " + row + " col: " + col);
              continue;
            }
            $cell.addClass("filled").css("background-color", nextPiece.color);
          }
        }
      }
    }
  }

  function createNewPiece() {
    const pieceShapes = [
      [[1, 1, 1, 1]],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1, 1],
        [1, 1, 0],
      ],
      [
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [1, 1, 1],
        [0, 0, 1],
      ],
      [
        [1, 1, 1],
        [1, 0, 0],
      ],
    ];

    const randomIndex = Math.floor(Math.random() * pieceShapes.length);

    if (nextPiece) {
      currentPiece.shape = nextPiece.shape;
      currentPiece.color = nextPiece.color;
    } else {
      currentPiece.shape = pieceShapes[randomIndex];
      currentPiece.color = getRandomColor();
    }

    nextPiece = {
      shape: pieceShapes[randomIndex],
      color: getRandomColor(),
    };

    currentPiece.row = 0;
    currentPiece.col = 3;
    isSavedBlockActive = true;
    createdPiceces++;
    if (level < 10) {
      if (createdPiceces % 10 === 0) {
        level++;
        $("#level").html("Level: " + level);
        speed = Math.max(100, 1000 - level * 90);
        clearInterval(intervalId);
        intervalId = setInterval(moveDown, speed);
      }
    }

    placePiece();
  }

  function movePiece(offsetRow, offsetCol) {
    currentPiece.row += offsetRow;
    currentPiece.col += offsetCol;
    placePiece();
  }

  function moveDown() {
    if (!checkCollision(1, 0)) {
      movePiece(1, 0);
    } else {
      freezePiece();
      checkLines();
      createNewPiece();

      if (checkCollision(0, 0)) {
        gameOver();
      }
    }
  }
  function rotatePiece() {
    var rotatedPiece = [];
    var rows = currentPiece.shape.length;
    var cols = currentPiece.shape[0].length;

    for (var col = 0; col < cols; col++) {
      var newRow = [];

      for (var row = rows - 1; row >= 0; row--) {
        newRow.push(currentPiece.shape[row][col]);
      }

      rotatedPiece.push(newRow);
    }

    if (!checkCollision(0, 0, rotatedPiece)) {
      currentPiece.shape = rotatedPiece;
      if (checkOverflow()) {
        while (checkOverflow()) {
          movePiece(0, -1);
        }
      }
      placePiece();
    }
  }

  function freezePiece() {
    for (var row = 0; row < currentPiece.shape.length; row++) {
      for (var col = 0; col < currentPiece.shape[row].length; col++) {
        if (currentPiece.shape[row][col]) {
          var newRow = currentPiece.row + row;
          var newCol = currentPiece.col + col;
          grid[newRow][newCol] = currentPiece.color;
        }
      }
    }
  }

  function checkCollision(rowOffset, colOffset, piece) {
    var checkPiece = piece || currentPiece.shape;
    var checkRow = currentPiece.row + rowOffset;
    var checkCol = currentPiece.col + colOffset;

    for (var row = 0; row < checkPiece.length; row++) {
      for (var col = 0; col < checkPiece[row].length; col++) {
        if (checkPiece[row][col] && (checkRow + row >= grid.length || checkCol + col < 0 || checkCol + col >= grid[0].length || grid[checkRow + row][checkCol + col] !== 0)) {
          return true;
        }
      }
    }

    return false;
  }
  function checkOverflow() {
    for (var row = 0; row < currentPiece.shape.length; row++) {
      for (var col = 0; col < currentPiece.shape[row].length; col++) {
        if (currentPiece.shape[row][col] && (currentPiece.col + col < 0 || currentPiece.col + col >= grid[0].length)) {
          return true;
        }
      }
    }

    return false;
  }
  function checkLines() {
    var completedRows = [];

    for (var r = 0; r < grid.length; r++) {
      if (grid[r].every((cell) => cell !== 0)) {
        completedRows.push(r);
      }
    }

    completedRows.forEach((rowIndex) => {
      grid.splice(rowIndex, 1);
      grid.unshift(new Array(10).fill(0));
    });
    if (completedRows.length === 1) {
      score += 800 * level;
    } else if (completedRows.length === 2) {
      score += 1200 * level;
    } else if (completedRows.length === 3) {
      score += 1800 * level;
    } else if (completedRows.length === 4) {
      score += 2000 * level;
    } else {
      score += completedRows.length * 10;
    }

    $("#score").html("Score: " + score);

    placePiece();
  }

  function initGame() {
    grid = [];
    currentPiece = {};
    savedBlock = { shape: [], color: null };
    isSavedBlockActive = true;
    nextPiece = null;
    createdPiceces = 0;
    score = 0;
    level = 1;
    speed = 1000;

    $("#level").html("Level: " + level);
    $("#score").html("Score: " + score);
    createGrid();
    createNewPiece();
    placePiece();
    intervalId = setInterval(moveDown, speed);
  }
  $(document).on("keydown", handleKeyPress);
  $(document).on("keyup", function () {
    $("#left").removeClass("active");
    $("#right").removeClass("active");
    $("#up").removeClass("active");
    $("#down").removeClass("active");
    $("#fastDown").removeClass("active");
    $("#save").removeClass("active");
  });

  function handleKeyPress(event) {
    if (intervalId !== null && intervalId !== undefined) {
      const keyCode = event.which;

      switch (keyCode) {
        case 37: // Left arrow
        case 65: // 'A' key
          moveLeft();
          $("#left").addClass("active");
          break;

        case 38: // Up arrow
        case 87: // 'W' key
          rotatePiece();
          $("#up").addClass("active");
          break;

        case 39: // Right arrow
        case 68: // 'D' key
          moveRight();
          $("#right").addClass("active");
          break;

        case 40: // Down arrow
        case 83: // 'S' key
          moveDown();
          $("#down").addClass("active");
          break;

        case 32: // Space
          moveDownFast();
          $("#fastDown").addClass("active");

          break;

        case 67: // 'C' key
          saveBlock();
          $("#save").addClass("active");
          break;

        default:
          break;
      }
    }
  }

  $("#up").on("click", function () {
    if (intervalId !== null && intervalId !== undefined) {
      rotatePiece();
    }
  });
  $("#left").on("click", function () {
    if (intervalId !== null && intervalId !== undefined) {
      moveLeft();
    }
  });
  $("#right").on("click", function () {
    if (intervalId !== null && intervalId !== undefined) {
      moveRight();
    }
  });
  $("#down").on("click", function () {
    if (intervalId !== null && intervalId !== undefined) {
      moveDown();
    }
  });
  $("#fastDown").on("click", function () {
    if (intervalId !== null && intervalId !== undefined) {
      moveDownFast();
    }
  });
  $("#save").on("click", function () {
    if (intervalId !== null && intervalId !== undefined) {
      saveBlock();
    }
  });

  function moveLeft() {
    if (!checkCollision(0, -1)) {
      movePiece(0, -1);
    }
  }

  function moveRight() {
    if (!checkCollision(0, 1)) {
      movePiece(0, 1);
    }
  }

  function moveDownFast() {
    while (!checkCollision(1, 0)) {
      movePiece(1, 0);
    }
    freezePiece(); // Place current piece
    checkLines(); // Check for full lines
    createNewPiece(); // Create new piece
    if (checkCollision(0, 0)) {
      gameOver();
    }
    placePiece(); // Place new piece
  }

  function saveBlock() {
    if (isSavedBlockActive) {
      swapSavedBlock();
      isSavedBlockActive = false;
    }
  }
  function swapSavedBlock() {
    if (!savedBlock.color) {
      savedBlock = { ...currentPiece };
      createNewPiece();
    } else if (!currentPiece || !currentPiece.shape) {
      return;
    } else {
      const tempBlock = { ...savedBlock };
      savedBlock = { ...currentPiece };
      currentPiece = { ...tempBlock, row: 0, col: 3 };
      placePiece();
    }
  }

  function gameOver() {
    clearInterval(intervalId);
    intervalId = null;
    $("#start-screen").css("display", "flex");
    $("#start-screen h1").html("Game Over");
    $("#start-screen button").html("Restart");
  }
  createGrid();

  function createGrid() {
    if (!$(".tetris-grid").length || !$(".saved-block-grid").length || !$(".next-block-grid").length) {
      console.error("One or more required grid elements are missing from the DOM.");
      return;
    }

    $(".tetris-grid").html("");
    $(".saved-block-grid").html("");
    $(".next-block-grid").html("");

    grid = [];
    for (var row = 0; row < 20; row++) {
      var newRow = [];
      for (var col = 0; col < 10; col++) {
        newRow.push(0);
        $(".tetris-grid").append('<div class="tetris-cell"></div>');
      }
      grid.push(newRow);
    }

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 4; col++) {
        $(".saved-block-grid").append('<div class="tetris-cell"></div>');
      }
    }

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 4; col++) {
        $(".next-block-grid").append('<div class="tetris-cell"></div>');
      }
    }
  }
  $("#start-button").click(function () {
    $("#start-screen").css("display", "none");
    initGame();
    console.log("Game started");
  });
  $("#pause-button").click(function () {
    if (intervalId !== null && intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = null;
      $("#pause-screen").css("display", "flex");
      console.log("Game paused");
    } else {
      intervalId = setInterval(moveDown, 1000);
      $("#pause-screen").css("display", "none");
      console.log("Game resumed");
    }
  });
});
