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
        missions: {}
    };

    function loadMissions() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: 'missions.json',
                dataType: 'json',
                success: function(data) {
                    resolve(data.missions);
                },
                error: function(xhr, status, error) {
                    reject(error);
                }
            });
        });
    }

    // توزیع تصادفی ماموریت‌ها در صفحه
    function distributeMissionsRandomly(missionsList) {
        gameState.missions = {};
        const missionCount = missionsList.length;
        
        // توزیع ماموریت‌ها به صورت تصادفی
        for (let i = 0; i < missionCount; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * size);
                col = Math.floor(Math.random() * size);
            } while (
                gameState.missions[`${row},${col}`] || // اگر خانه قبلاً ماموریت دارد
                (row === 0 && col === 0) // یا خانه شروع است
            );
            
            gameState.missions[`${row},${col}`] = missionsList[i];
        }
    }

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
        
        const p1Pos = gameState.positions[1];
        const p1Row = Math.floor(p1Pos / size);
        const p1Col = p1Pos % size;
        const player1 = $('<div class="player player1">1</div>');
        $(`#cell-${p1Row}-${p1Col}`).append(player1);
        
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
        
        const path = [];
        for (let i = 1; i <= steps; i++) {
            path.push((currentPos + i) % (size * size));
        }
        
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
        
        $(`.player${gameState.currentPlayer}`).detach();
        $(`#cell-${row}-${col}`).append($(`<div class="player player${gameState.currentPlayer}">${gameState.currentPlayer}</div>`));
        
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

    // شروع بازی و بارگذاری ماموریت‌ها
    loadMissions()
        .then(missionsList => {
            distributeMissionsRandomly(missionsList);
            createBoard();
            logMessage('بازی شروع شد! ماموریت‌ها به صورت تصادفی توزیع شدند.');
        })
        .catch(error => {
            console.error('خطا در بارگذاری ماموریت‌ها:', error);
            // استفاده از ماموریت‌های پیش‌فرض در صورت خطا
            const defaultMissions = [
                "ماموریت پیش‌فرض: به خانه شروع بازگرد",
                "ماموریت پیش‌فرض: جایزه ویژه!"
            ];
            distributeMissionsRandomly(defaultMissions);
            createBoard();
            logMessage('بازی با ماموریت‌های پیش‌فرض شروع شد (خطا در بارگذاری فایل ماموریت‌ها)');
        });
});