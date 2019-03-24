/**
 * 画面のリサイズイベントを追加
 */
class Boot extends Phaser.Scene {
  constructor () {
    super({ key: 'boot' })
  }

  create () {
    window.addEventListener('resize', this.resize.bind(this))
    this.scene.start('preloader')
  }

  resize () {
    let w = window.innerWidth * window.devicePixelRatio
    let h = window.innerHeight * window.devicePixelRatio
    this.scale.resize(w, h)

    for (let scene of this.scene.manager.scenes) {
      if (scene.scene.settings.active) {
        scene.cameras.main.setViewport(0, 0, w, h)
        if (scene.resizeField) {
          scene.resizeField(w, h)
        }
      }
    }
  }
}

/**
 * 画像のプレロード
 */
class Preloader extends Phaser.Scene {
  constructor () {
    super({ key: 'preloader' })
  }

  preload () {
    let progress = this.add.graphics()
    this.load.on('progress', function (value) {
      progress.clear()
      progress.fillStyle(0xe5ffff, 1)
      progress.fillRect(0, (window.innerWidth/2 * window.devicePixelRatio) - 30, window.innerWidth * value * window.devicePixelRatio, 60)
    })
    this.load.on('complete', function () {
      progress.destroy()
    })

    let imageSize = window.devicePixelRatio * 100
    this.load.image('squid', 'assets/squid@' + imageSize + 'x.png')
  }

  create () {
    this.scene.start('level')
  }
}

/**
 * 画像を表示
 */
class Level extends Phaser.Scene {
  constructor (config) {
    super(config ? config : { key: 'level' })
    this.image = undefined;
  }

  create () {
    this.cameras.main.setRoundPixels(true) // カメラの位置を丸める
    this.image = this.add.image(0, 0, 'squid')
    this.resizeField(this.sys.game.config.width, this.sys.game.config.height)
  }

  resizeField (w, h) {
    this.image.x = w / 2
    this.image.y = h / 2
  }
}

var config = {
  type: Phaser.WEBGL,
  backgroundColor: '#969fa3',
  pixelArt: true, // アンチエイリアスを無効に
  scale: {
    mode: Phaser.Scale.NONE, // 自分でリサイズをするので何もさせない
    width: window.innerWidth * window.devicePixelRatio, // ゲーム幅設定
    height: window.innerHeight * window.devicePixelRatio, // ゲーム高さ設定
    zoom: 1 / window.devicePixelRatio, // devicePixelRadioの逆を設定
  },
  scene: [
    Boot,
    Preloader,
    Level
  ]
}

const game = new Phaser.Game(config)
