phina.globalize();

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 640;
var SCORE = 0;
const ASSETS = {
    "image": {
        "buro": "./assets/image/buropiyo.png",
        "mero": "./assets/image/meropiyo.png",
        "mika": "./assets/image/mikapiyo.png",
        "nasu": "./assets/image/nasupiyo.png",
        "take": "./assets/image/takepiyo.png",
        "toma": "./assets/image/tomapiyo.png"
    }
};
const ENEMY_ASSETS = [
    "buro", "mero", "mika", "nasu", "take"
];

phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function () {
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        });
        // X/Yそれぞれ40分割したグリッドで置き換え
        this.gridX = Grid(SCREEN_WIDTH, 40);
        this.gridY = Grid(SCREEN_HEIGHT, 40);
        this.backgroundColor = 'black';

        this.player = Player(
            this.gridX.center(), this.gridY.span(37)).addChildTo(this);

        // 複数の敵を登録する対象
        this.enemyGroup = EnemyGroup().addChildTo(this);
        const enemy = [];
        for(var x = 0 ; x <= 8; x++) {
            for(var y = 0; y <= 5; y++) {
                enemy.push(Enemy(this.gridX.span(x * 2), this.gridY.span(y * 4), ENEMY_ASSETS[y % 5]).addChildTo(this.enemyGroup));
            }
        }
        this.score = 0;
        // 敵が発射したミサイルを登録する対象
        this.missileGroup = DisplayElement().addChildTo(this);
        var score = Label({
            text: this.score + '',
            fill: 'yellow',
            fontSize: 20
        }).addChildTo(this);
        score.setPosition(this.gridX.span(37), this.gridY.span(38)).addChildTo(this);
    },
    update: function (app) {
        this.enemyGroup.children.forEach(enemy => {
            if (Math.random() * 10000 <= 10) {
                const missile = Missile(enemy.x, enemy.y).addChildTo(this.missileGroup);
            }
        });
        // ミサイルと弾の当たり判定
        if (this.player.bullet != null) {
            this.missileGroup.children.some(missile => {
                if (missile.hitTestElement(this.player.bullet)) {
                    missile.flare('hit');
                    this.player.bullet.flare('hit');
                }
            })
        }
        // 弾と敵の当たり判定
        if (this.player.bullet != null) {
            this.enemyGroup.children.some(enemy => {
                if (enemy.hitTestElement(this.player.bullet)) {
                    // 直接それぞれのメソッドを呼ばずにイベントで対応させる。
                    enemy.flare('hit');
                    this.player.bullet.flare('hit');
                    SCORE += 100;
                    return true;
                }

                return false;
            })
        }
        // ミサイルとプレイヤーの当たり判定
        this.missileGroup.children.some(missile => {
            if (missile.hitTestElement(this.player)) {
                missile.flare('hit');
                this.player.flare('hit');
                this.exit();
            }
        });
        if (this.enemyGroup.children.length <= 0) {
            SCORE += 1000;
            this.exit();
        }
    }
});

phina.define("ResultScene", {
    superClass: "ResultScene",
    init: function() {
        this.superInit({
            score: SCORE,
            message: "GOOD GAME",
            width: SCREEN_WIDTH,
            hight: SCREEN_HEIGHT
        });
        SCORE = 0;
    }
});

phina.define('Player', {
    superClass: 'Sprite',
    init: function (x, y) {
        this.superInit('toma', 64, 64);
        this.setFrameIndex(10, 64, 64);
        this.x = x;
        this.y = y;
        this.SPEED = 5;
        this.bullet = null;
    },

    update: function (app) {
        const key = app.keyboard;

        if (key.getKey('left')) {
            this.x -= this.SPEED;
            if (this.left < 0) {
                this.left = 0;
            }
        }
        if (key.getKey('right')) {
            this.x += this.SPEED;
            if (this.right > SCREEN_WIDTH) {
                this.right = SCREEN_WIDTH;
            }
        }

        // 弾は同時に1発しか発射できない仕様なので、bulletがnullのときにスペースキー押されていたら発射
        if (this.bullet == null && key.getKey('space')) {
            this.bullet = Bullet(this.x, this.top).addChildTo(this.parent);
        }

        // すでにbulletが無効(isInvalid==true)ならnullにする
        if (this.bullet != null && this.bullet.isInvalid) {
            this.bullet = null;
        }
    },

    onhit: function () {
        this.remove();
    }

});

phina.define('Bullet', {
    superClass: 'RectangleShape',
    init: function (x, y) {
        this.superInit({
            width: 3,
            height: 15,
            fill: 'white',
            stroke: null,
        });
        this.x = x;
        this.y = y;
        this.isInvalid = false;
        this.SPEED = 5;
    },

    // 弾を画面上から消して無効にするイベントリスナ(なにかに当たった)
    onhit: function () {
        this.remove();
        this.isInvalid = true;
    },

    update: function () {
        this.y -= this.SPEED;
        if (this.bottom < 0) {
            this.flare('hit');
        }
    }
});

phina.define('Enemy', {
    superClass: 'Sprite',
    init: function (x, y, image) {
        this.superInit(image, 64, 64);
        this.setFrameIndex(7, 64, 64);
        this.x = x;
        this.y = y;
    },

    // 敵を画面上から消すイベントリスナ(倒された)
    onhit: function () {
        this.remove();
    },
});

phina.define('Missile', {
    superClass: 'PathShape',

    init: function (x, y) {
        this.superInit({
            // ミサイルの見た目(相対パスで指定)
            paths: [
                {x: 0, y: 0},
                {x: 3, y: 2},
                {x: -3, y: 4},
                {x: 3, y: 6},
                {x: -3, y: 8},
                {x: 3, y: 10},
                {x: -3, y: 12},
                {x: 3, y: 14},
                {x: 0, y: 16},
            ],
            fill: null,
            // ミサイルの色
            stroke: 'orangered',
            lineJoin: 'miter',
            // ミサイルの線の太さ
            strokeWidth: 1,
        });
        this.x = x;
        this.y = y;
        // ミサイルの移動速度
        this.SPEED = 4;
    },
    onhit: function () {
        this.remove();
    },

    update: function () {
        this.y += this.SPEED;
        if (this.top > SCREEN_HEIGHT) {
            this.flare('hit');
        }
    }
});

phina.define('EnemyGroup', {
    superClass: 'DisplayElement',
    init: function () {
        this.superInit();
        this.time = 0;
        this.interval = 2000;
        this.direction = 1;
    },
    update: function (app) {
        // deltaTimeを加算していって経過時間を計る
        this.time += app.deltaTime;
        const scene = this.parent;

        let right = 0;
        let left = scene.gridX.columns;

        console.log(this.interval);

        if(35 <= this.children.length && this.children.length < 40){
            this.interval = 1500;
        }else if(30 <= this.children.length && this.children.length < 35){
            this.interval = 1000;
        }else if(25 <= this.children.length && this.children.length < 30){
            this.interval = 500;
        }else if(15 <= this.children.length && this.children.length < 25){
            this.interval = 300;
        }else if(5 <= this.children.length && this.children.length < 15){
            this.interval = 200;
        }else if(5 > this.children.length){
            this.interval = 100;
        }

        if (this.time / this.interval >= 1) {
            this.children.forEach(enemy => {
                enemy.moveBy(scene.gridX.unit() * this.direction, 0);
                // 全体の右端のポジションを計算
                right = Math.max(right, enemy.x / scene.gridX.unit());
                // 全体の左端のポジションを計算
                left = Math.min(left, enemy.x / scene.gridX.unit());
            });
            this.time -= this.interval;
        }

        // 移動の向きを変更するタイミング
        if (this.direction > 0 && right >= 38
            || this.direction < 0 && left <= 2) {
            this.direction = -this.direction;
            this.children.forEach(enemy => {
                enemy.moveBy(0, 20);
            });
        }
    }
});

phina.main(() => {
    const app = GameApp({
        title: "インベーダー",
        fps: 60,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
    });

    app.run();
});