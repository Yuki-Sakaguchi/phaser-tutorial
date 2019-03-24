// 設定
let game
let saveData
let gameOptions = {
  bgColors: [0x62bd18, 0xff5300, 0xd21034, 0xff475c, 0x8f16b2, 0x588c7e, 0x8c4646],
  holeWidthRange: [80, 260],
  wallRange: [10, 50],
  growTime: 1500,
  localStorageName: 'block-drop'
}

// 定数
const IDLE = 0
const WAITING = 1
const GROWING = 2

/**
 * 初期化
 */
window.onload = function () {
  let width = 640
  let height = 960

  // 縦横比に応じて、高さを変更する
  let windowRatio = window.innerWidth / window.innerHeight
  if (windowRatio < width / height) {
    height = width / windowRatio
  }

  let gameConfig = {
    width: width,
    height: height,
    scene: PlayGame,
    backgroundColor: 0x444444,
  }

  // ゲーム開始
  game = new Phaser.Game(gameConfig)
  window.focus()
  resize()
  window.addEventListener('resize', resize)
}

/**
 * 画面リサイズ時の処理
 */
function resize () {
  let canvas = document.querySelector('canvas')
  let windowWidth = window.innerWidth
  let windowHeight = window.innerHeight
  let windowRatio = windowWidth / windowHeight
  let gameRatio = game.config.width / game.config.height

  if (windowRatio < gameRatio) {
    // ゲーム幅よりも小さくなった場合は画面に合わせてリサイズ
    canvas.style.width = windowWidth+'px'
    canvas.style.height = windowHeight+'px'
  } else {
    // ゲーム幅よりも大きくなった場合はゲーム幅の最大横幅に合わせてリサイズ
    canvas.style.width = (windowHeight * gameRatio)+'px'
    canvas.style.height = windowHeight+'px'
  }
}

/**
 * シーンクラスを継承してゲームを作成
 */
class PlayGame extends Phaser.Scene {
  constructor () {
    super('PlayGame')
  }

  /**
   * 事前準備
   */
  preload () {
    this.load.image('base', 'assets/base.png')
    this.load.image('square', 'assets/square.png')
    this.load.image('top', 'assets/top.png')
    this.load.bitmapFont('font', 'assets/font.png', 'assets/font.fnt')
  }

  /**
   * ゲーム開始時の設定
   */
  create () {
    // セーブデータを取得
    saveData = localStorage.getItem(gameOptions.localStorageName) == null ? { level: 1 } : JSON.parse(localStorage.getItem(gameOptions.localStorageName))

    // ランダムで背景を設定
    let tintColor = Phaser.Utils.Array.GetRandom(gameOptions.bgColors)
    this.cameras.main.setBackgroundColor(tintColor)

    // 左下の床
    this.leftSquare = this.add.sprite(0, game.config.height, 'base')
    this.leftSquare.setOrigin(1, 1)

    // 右下の床
    this.rightSquare = this.add.sprite(game.config.width, game.config.height, 'base')
    this.rightSquare.setOrigin(0, 1)

    // 左の壁
    this.leftWall = this.add.sprite(0, game.config.height - this.leftSquare.height, 'top')
    this.leftWall.setOrigin(1, 1)

    // 右の壁
    this.rightWall = this.add.sprite(game.config.width, game.config.height - this.rightSquare.height, 'top')
    this.rightWall.setOrigin(0, 1)

    // 箱
    this.square = this.add.sprite(game.config.width / 2, -400, 'square')
    this.square.successful = 0
    this.square.setScale(0.2)

    // 箱テキスト
    this.squareText = this.add.bitmapText(game.config.width / 2, -400, 'font', (saveData.level - this.square.successful).toString())
    this.squareText.setOrigin(0.5)
    this.squareText.setScale(0.4)
    this.squareText.setTint(tintColor)

    // レベルテキスト
    this.levelText = this.add.bitmapText(game.config.width / 2, 0, 'font', 'level ' + saveData.level, 60)
    this.levelText.setOrigin(0.5, 0)
    
    this.updateLevel()

    this.input.on('pointerdown', this.grow, this)
    this.input.on('pointerup', this.stop, this)

    this.gameMode = IDLE
  }

  /**
   * ボックスのアニメーション設定
   */
  updateLevel () {
    let holeWidth = Phaser.Math.Between(gameOptions.holeWidthRange[0], gameOptions.holeWidthRange[1])
    let wallWidth = Phaser.Math.Between(gameOptions.wallRange[0], gameOptions.wallRange[1])
    
    this.placeWall(this.leftSquare, (game.config.width - holeWidth) / 2)
    this.placeWall(this.rightSquare, (game.config.width + holeWidth) / 2)
    this.placeWall(this.leftWall, (game.config.width - holeWidth) / 2 - wallWidth)
    this.placeWall(this.rightWall, (game.config.width + holeWidth) / 2 + wallWidth)

    let suqareTween = this.tweens.add({
      targets: [this.square, this.squareText],
      y: 150,
      scaleX: 0.2,
      scaleY: 0.2,
      angle: 50,
      duration: 500,
      ease: 'Cubic.easeOut',
      callbackScope: this,
      onComplete: function () {
        this.rotateTween = this.tweens.add({
          targets: [this.square, this.squareText],
          angle: 40,
          duration: 300,
          yoyo: true,
          repeat: -1,
        })
        if (this.square.successful == 0) {
          this.addInto(holeWidth, wallWidth)
        }
        this.gameMode = WAITING
      }
    })
  }

  /**
   * 壁のアニメーション
   * @param {*} target 
   * @param {*} posX 
   */
  placeWall (target, posX) {
    this.tweens.add({
      targets: target,
      x: posX,
      duration: 500,
      ease: 'Cubic.easeOut'
    })
  }

  /**
   * ゲームモードを更新して大きくする
   */
  grow () {
    if (this.gameMode == WAITING) {
      this.gameMode = GROWING
      if (this.square.successful == 0) {
        this.infoGroup.toggleVisible()
      }
      this.growTween = this.tweens.add({
        targets: [this.square, this.squareText],
        scaleX: 1,
        scaleY: 1,
        duration: gameOptions.growTime
      })
    }
  }

  stop () {
    if (this.gameMode == GROWING) {
      // アイドル状態に戻す
      this.gameMode = IDLE

      // アニメーションを止める
      this.growTween.stop()
      this.rotateTween.stop()

      this.rotateTween = this.tweens.add({
        targets: [this.square, this.squareText],
        angle: 0,
        duration: 300,
        ease: 'Cubic.easeOut',
        callbackScope: this,
        onComplete: function () {
          if (this.square.displayWidth <= this.rightSquare.x - this.leftSquare.x) {
            this.tweens.add({
              targets: [this.square, this.squareText],
              y: game.config.height + this.square.displayWidth,
              duration: 600,
              ease: 'Cubic.easeIn',
              callbackScope: this,
              onComplete: function () {
                this.levelText.text = 'Oh no!!',
                this.gameOver()
              }
            })
          } else {
            if (this.square.displayWidth <= this.rightWall.x - this.leftWall.x) {
              this.fallAndBounce(true)
            } else {
              this.fallAndBounce(false)
            }
          }
        }
      })
    }
  }

  fallAndBounce (success) {
    let destY = game.config.height - this.leftSquare.displayHeight - this.square.displayHeight / 2
    let message = 'Yeah!!'
    if (success) {
      this.square.successful++
    } else {
      destY  = game.config.height - this.leftSquare.displayHeight - this.leftWall.displayHeight - this.square.displayHeight / 2
      message = 'Oh no!!!!!'
    }
    this.tweens.add({
      targets: [this.square, this.squareText],
      y: destY,
      duration: 600,
      ease: 'Bounce.easeOut',
      callbackScope: this,
      onComplete: function () {
        this.levelText.text = message
        if (!success) {
          this.gameOver()
        } else {
          this.time.addEvent({
            delay: 1000,
            callback: function () {
              if (this.square.successful == saveData.level) {
                saveData.level++
                localStorage.setItem(gameOptions.localStorageName, JSON.stringify({
                  level: saveData.level
                }))
                this.scene.start('PlayGame')
              } else {
                this.squareText.text = saveData.level - this.square.successful
                this.squareText.setOrigin(1, 1)
                this.levelText.text = 'level ' + saveData.level
                this.updateLevel()
              }
            },
            callbackScope: this,
          })
        }
      }
    })
  }

  addInto (holeWidth, wallWidth) {
    this.infoGroup = this.add.group()
    
    let targetSquare = this.add.sprite(game.config.width / 2, game.config.height - this.leftSquare.displayHeight, 'square')
    targetSquare.displayWidth = holeWidth + wallWidth
    targetSquare.displayHeight = holeWidth + wallWidth
    targetSquare.alpha = 0.3
    targetSquare.setOrigin(0.5, 1)
    this.infoGroup.add(targetSquare)

    let targetText = this.add.bitmapText(game.config.width / 2, targetSquare.y - targetSquare.displayHeight - 20, "font", "land here", 48)
    targetText.setOrigin(0.5, 1)
    this.infoGroup.add(targetText)

    let holdText = this.add.bitmapText(game.config.width / 2, 250, "font", "tap and hold to grow", 40)
    holdText.setOrigin(0.5, 0)
    this.infoGroup.add(holdText)

    let releaseText = this.add.bitmapText(game.config.width / 2, 300, "font", "release to drop", 40)
    releaseText.setOrigin(0.5, 0)
    this.infoGroup.add(releaseText)
  }

  gameOver() {
    this.time.addEvent({
      delay: 1000,
      callback: function() {
        this.scene.start("PlayGame")
      },
      callbackScope: this
    })
  }
}