$(document).ready(function() {
    const board = $('#game-board');
    const log = $('#log');
    const size = 10;
    const gameState = {
      currentPlayer: 1,
      positions: { 
        1: 0, 
        2: 0 
      },
      isMoving: false,
      missions: {
        "0,0": "به کتابخانه برو و یک کتاب بخوان. 2 نوبت استراحت!",
        "2,3": "مأموریت مخفی! به خانه 5,5 برو.",
        "4,7": "شیر یا خط! اگر شیر آوردی 3 خانه جلو، خط 2 خانه عقب.",
        "1,1": "مسابقه دو! تا نوبت بعدی 2 برابر حرکت کن.",
        "5,5": "جایزه بزرگ! مستقیم به خانه شروع بازگرد.",
        "7,2": "معما حل کن: اگر جواب درست دادی 4 خانه جلو.",
        "3,8": "دور اضافه! دوباره تاس بینداز.",
        "9,9": "پایان بازی نزدیک است! 1 خانه عقب برو.",
        "6,4": "مبادله موقعیت! جای خود را با حریف عوض کن.",
        "8,1": "تله! به خانه قبلی بازگرد.",
        "0,9": "پل هوایی! مستقیم به سطر مقابل برو.",
        "9,0": "چرخش باد! 3 خانه در جهت عقربه‌های ساعت حرکت کن.",
        "2,5": "سوال علمی! اگر پاسخ صحیح دادی 5 خانه جلو.",
        "5,2": "مهمانی! همه بازیکنان به این خانه بیایند.",
        "7,7": "سیاهچاله! به یک خانه تصادفی منتقل می‌شوی.",
        "4,4": "مرکز جهان! یک آرزو کن و به آن برس.",
        "1,8": "دزدان دریایی! 3 خانه به عقب برو.",
        "8,3": "جادوگر! یک بازیکن را به خانه شروع بفرست.",
        "3,3": "عدد شانس! اگر عدد فرد آوردی 2 خانه جلو.",
        "6,6": "آینه جادویی! حرکت بعدی معکوس می‌شود."
      }
    };
  
    // ایجاد صفحه بازی
    function createBoard() {
      board.empty();
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const cellId = `${row},${col}`;
          const cellNumber = row * size + col + 1;
          const cell = $(`<div class="cell" id="cell-${row}-${col}" data-row="${row}" data-col="${col}"></div>`);
          
          if (cellNumber === 1) {
            cell.addClass('start').text('شروع');
          }
          
          if (gameState.missions[cellId]) {
            cell.append('<div class="mission-indicator">!</div>');
          }
          
          board.append(cell);
        }
      }
      updatePlayers();
    }
  
    // به روز رسانی موقعیت بازیکنان
    function updatePlayers() {
      $('.player').remove();
      
      // ایجاد و قرار دادن مهره بازیکن 1
      const p1Pos = gameState.positions[1];
      const p1Row = Math.floor(p1Pos / size);
      const p1Col = p1Pos % size;
      const player1 = $('<div class="player player1">1</div>');
      $(`#cell-${p1Row}-${p1Col}`).append(player1);
      
      // ایجاد و قرار دادن مهره بازیکن 2
      const p2Pos = gameState.positions[2];
      const p2Row = Math.floor(p2Pos / size);
      const p2Col = p2Pos % size;
      const player2 = $('<div class="player player2">2</div>');
      $(`#cell-${p2Row}-${p2Col}`).append(player2);
    }
  
    // حرکت بازیکن با انیمیشن
    function movePlayer(steps) {
      if (gameState.isMoving) return;
      gameState.isMoving = true;
      $('#dice').prop('disabled', true);
      
      const currentPos = gameState.positions[gameState.currentPlayer];
      const newPos = (currentPos + steps) % (size * size);
      
      // محاسبه مسیر حرکت
      const path = [];
      for (let i = 1; i <= steps; i++) {
        path.push((currentPos + i) % (size * size));
      }
      
      // انیمیشن حرکت گام به گام
      animateMovement(path, 0, () => {
        gameState.positions[gameState.currentPlayer] = newPos;
        gameState.isMoving = false;
        checkMission(newPos);
        updatePlayerTurn();
      });
    }
  
    // انیمیشن حرکت
    function animateMovement(path, index, callback) {
      if (index >= path.length) {
        if (callback) callback();
        return;
      }
      
      const position = path[index];
      const row = Math.floor(position / size);
      const col = position % size;
      
      // جابجایی مهره
      $(`.player${gameState.currentPlayer}`).detach();
      $(`#cell-${row}-${col}`).append($(`<div class="player player${gameState.currentPlayer}">${gameState.currentPlayer}</div>`));
      
      // تأخیر برای انیمیشن
      setTimeout(() => {
        animateMovement(path, index + 1, callback);
      }, 200);
    }
  
    // بررسی ماموریت
    function checkMission(position) {
      const row = Math.floor(position / size);
      const col = position % size;
      const key = `${row},${col}`;
      
      if (gameState.missions[key]) {
        const missionText = gameState.missions[key];
        $('#mission-text').text(missionText);
        logMessage(`بازیکن ${gameState.currentPlayer}: ${missionText}`);
        
        // افکت ویژه برای ماموریت
        $(`#cell-${row}-${col}`).addClass('mission-active');
        setTimeout(() => {
          $(`#cell-${row}-${col}`).removeClass('mission-active');
        }, 1000);
      }
    }
  
    // ثبت پیام در لاگ
    function logMessage(msg) {
      const now = new Date();
      const time = now.toLocaleTimeString('fa-IR');
      log.prepend(`<div><span class="log-time">${time}</span> - ${msg}</div>`);
    }
  
    // به روزرسانی نوبت بازیکن
    function updatePlayerTurn() {
      gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
      $('#player-turn')
        .removeClass('player1-turn player2-turn')
        .addClass(gameState.currentPlayer === 1 ? 'player1-turn' : 'player2-turn')
        .html(`<i class="fas fa-user${gameState.currentPlayer === 1 ? '' : '-friends'}"></i> نوبت: بازیکن ${gameState.currentPlayer}`);
      
      $('#dice').prop('disabled', false);
    }
  
    // رویداد کلیک روی تاس
    $('#dice').click(() => {
      if (gameState.isMoving) return;
      
      // انیمیشن تاس
      let rolls = 0;
      const maxRolls = 10;
      const diceInterval = setInterval(() => {
        rolls++;
        const randomValue = Math.floor(Math.random() * 6) + 1;
        $('#dice-result').text(randomValue);
        
        if (rolls >= maxRolls) {
          clearInterval(diceInterval);
          const diceValue = Math.floor(Math.random() * 6) + 1;
          $('#dice-result').text(diceValue);
          logMessage(`بازیکن ${gameState.currentPlayer} تاس انداخت: ${diceValue}`);
          movePlayer(diceValue);
        }
      }, 100);
    });
  
    // شروع بازی
    createBoard();
    logMessage('بازی شروع شد!');
  });