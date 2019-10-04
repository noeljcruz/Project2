var config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var coins;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
// var highScore = JSON.parse 
// var userName;

var game = new Phaser.Game(config);

function preload() {
    //this.load.path = ('../routes/') // load the api routes (may not be needed)
    this.load.image('background', '../assets/pirateShip.png');
    //this.load.image('')
    this.load.image('ground', 'assets/platform.png');
    this.load.image('coin', 'assets/goldcoin.png');
    this.load.image('bomb', 'assets/bomb.png');
    // Load the Character spritesheet
    this.load.spritesheet("captain", '../assets/captain-m-001-light.png', {
        frameWidth: 48,
        frameHeight: 64
    });
    // load audio
    this.load.audio('music', ['../assets/Pirate1_Theme1.mp3', '../assets/Pirate_Theme.ogg']); // background music
    this.load.audio('waves', '../assets/oceanwaves.ogg'); // ocean waves
    this.load.audio('arrr', '../assets/arrr.wav'); // death chant

    // to add
    // jumping sound
    // coin collect sound
}

function create() {
    // Load background music
    let themeSong = this.sound.add('music', {
        volume: 1,
        loop: true
    });
    themeSong.play();

    // Load waves background
    let waves = this.sound.add('waves', {
        volume: 1,
        loop: true
    });
    waves.play();

    //  A simple background for our game
    this.add.image(512, 300, 'background');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(514, 600, 'ground').setScale(3.5).refreshBody();

    //  Now let's create some ledges
    platforms.create(632, 400, 'ground'); //middle platform
    platforms.create(120, 350, 'ground'); //left platform
    platforms.create(825, 220, 'ground'); //right platform

    // The player and its settings
    player = this.physics.add.sprite(100, 450, 'captain');

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('captain', { start: 10, end: 12 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'captain', frame: 8 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('captain', { start: 3, end: 5 }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  Some coins to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    coins = this.physics.add.group({
        key: 'coin',
        repeat: 14,
        setXY: { x: 24, y: 0, stepX: 70 },
    });

    coins.children.iterate(function (child) {

        //  Give each coin a slightly different bounce
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });

    bombs = this.physics.add.group();

    //  The score
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });


    //  Collide the player and the coins with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(coins, platforms);
    this.physics.add.collider(bombs, platforms);

    //  Checks to see if the player overlaps with any of the coins, if he does call the collectCoin function
    this.physics.add.overlap(player, coins, collectCoin, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);

    //  The Game Over text....
    gameOverText = this.add.text(412, 300, 'Game Over', { fontSize: '32px', fill: '#000' });
    //this.gameOverText.setOrigin(0.5);
    gameOverText.visible = false;
}

function update() {
    if (gameOver) {
        // store time game ended
        var timeStamp = Math.floor(Date.now()) / 1000;

        // Save score to final score, score will be reset to zero when game restarts 
        finalScore = score;

        // gets the userName from the player
        var userName = prompt("Please enter your name", "name");
        //localStorage.setItem("playerName", userName);

        // Check that data was store successfuly
        console.log("User: " + userName + "'s score is " + finalScore + " at " + timeStamp + ".");

        var gameData = {
            userName: userName,
            score: finalScore,
            date: timeStamp
        }

        $.ajax({
            method: "POST",
            url: "/api/scores",
            data: gameData
        })
        // Reset gameOver to prevent update() loop and prepare game to restart
        gameOver = false;
        // window.confirm("Would you like to play again?");
        // // add call to start function again
        // if (confirm) {
        //     this.game.state.restart()
        // } else {
        return;
        // }

    }

    if (cursors.left.isDown) {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

function collectCoin(player, coin) {
    coin.disableBody(true, true);
    // this.starsBurst.explode();
    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (coins.countActive(true) === 0) {
        //  A new batch of coins to collect
        coins.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 30);
        bomb.allowGravity = false;

    }
}

function hitBomb(player, bomb) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;

    gameOverText.visible = true;
}