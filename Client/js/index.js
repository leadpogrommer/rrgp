// (function () {
class Connection {
    constructor(addr) {
        this.nextid = 0;
        this.promiseControl = [];
        this.ws = new WebSocket(addr);
        this.id = -1;
        this.onstate = (s) => { };
        this.ws.onmessage = ((msg) => {
            if (this.id === -1) {
                this.id = parseInt(msg.data);
                return;
            }
            let resp = JSON.parse(msg.data);
            if (resp.hasOwnProperty('name')) {
                this.onstate(resp.response)
            }
        }).bind(this);
    }

    sendRequest(name, ...args) {
        this.ws.send(JSON.stringify({ op: name, args: args, rid: this.nextid++ }))
    }
}

var nickname = ''

var Camera = {
    pos: {
        x: 0,
        y: 0
    },
}

let protocol = (location.port === "") ? "wss" : "ws"
var ws = new Connection(`${protocol}://${document.domain}:${location.port}/game`)
let st = new SkillTree(skills, ws)

let entobj = {}
ws.onstate = (ent) => {
    for (key in ent) {
        if (!entobj.hasOwnProperty(key)) {
            entobj[key] = ent[key];
            entobj[key].size = { x: entobj[key].sizex, y: entobj[key].sizey }
            continue
        }
        for (i in ent[key]) entobj[key][i] = ent[key][i]
        entobj[key].size = { x: entobj[key].sizex, y: entobj[key].sizey}
    }
    for (key in entobj) if (!ent.hasOwnProperty(key)) delete entobj[key]
    entities = Object.values(entobj)
    if(entobj[ws.id].respTimer > 0 && !st.resetted){
        st.reset()
        st.resetted = true;
    }
    if(entobj[ws.id].respTimer <= 0){
        st.resetted = false;
    }
    st.gold = entobj[ws.id].gold
}

var canv = document.getElementById("canv")
var ctx = canv.getContext("2d")
var entities = []
var sprites = {
    ship: new Image(),
    buttonL: new Image(),
    buttonLhover: new Image(),
    buttonLpressed: new Image(),
    buttonR: new Image(),
    buttonRhover: new Image(),
    buttonRpressed: new Image(),
    minimap: new Image(),
    bullet: new Image(),
    border: new Image(),
    teams: [
        new Image(), new Image(), new Image()
    ],
    paraNeko: new Image(),
    island: new Image(),
    box: new Image()
}

sprites.ship.src = "img/ship.png"
sprites.buttonL.src = "img/buttonL.png"
sprites.buttonLhover.src = "img/buttonLhover.png"
sprites.buttonLpressed.src = "img/buttonLpressed.png"
sprites.buttonR.src = "img/buttonR.png"
sprites.buttonRhover.src = "img/buttonRhover.png"
sprites.buttonRpressed.src = "img/buttonRpressed.png"
sprites.minimap.src = "img/minimap.png"
sprites.bullet.src = "img/bullet.png"
sprites.border.src = "img/border.png"
sprites.teams[0].src = "img/team1.png"
sprites.teams[1].src = "img/team2.png"
sprites.teams[2].src = "img/team3.png"
sprites.paraNeko.src = "img/trap.png"
sprites.island.src = "img/island.png"
sprites.box.src - "img/gold.png"

var lastMousePosition = {
    x: 0, y: 0
}

var lastTouch = {
    x: 0, y: 0
}
var touchPressing = false
var shot = -1

var mapSize = {
    x: 2000,
    y: 2000
}
var highlight = {
    left: false,
    right: false
}

var animationCoef = 1

var fields = [
    new Image(),
]
fields[0].src = "img/sea.png"
var offset = 2

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function init() {
    document.addEventListener("keydown", (e) => {
        let you = entities.filter(ent => ent.id == ws.id)[0]
        console.log(e.keyCode);
        switch (e.keyCode) {
            case 74:
                shot1()
                highlight.left = true
                break

            case 76:
                shot2()
                highlight.right = true
                break

            case 68:
                ws.sendRequest("turn", 2)
                break

            case 65:
                ws.sendRequest("turn", 1)
                break

            case 87:
                ws.sendRequest("accelerate", true)
                break

            case 83:
                ws.sendRequest("accelerate", false)
                break
        }
    })

    canv.addEventListener("mousemove", (e) => {
        lastMousePosition.x = e.clientX - canv.getBoundingClientRect().left
        lastMousePosition.y = e.clientY - canv.getBoundingClientRect().top
    })

    document.addEventListener("touchstart", handleStart, false);
    document.addEventListener("touchend", () => {
        touchPressing = false
    }, false);

    canv.addEventListener("mousedown", (e) => {
        let center = 0.5 * canv.width
        let leftButtonCoords = {
            x: center - 0.05 * canv.width,
            y: 0.8 * canv.height
        }

        if (lastMousePosition.x >= leftButtonCoords.x && lastMousePosition.x <= leftButtonCoords.x + 60 &&
            lastMousePosition.y >= leftButtonCoords.y && lastMousePosition.y <= leftButtonCoords.y + 60) {
            shot1()
            highlight.left = true
        }

        if (lastMousePosition.x >= leftButtonCoords.x + 0.1 * canv.width && lastMousePosition.x <= leftButtonCoords.x + 60 + 0.1 * canv.width &&
            lastMousePosition.y >= leftButtonCoords.y && lastMousePosition.y <= leftButtonCoords.y + 60) {
            shot2()
            highlight.right = true
        }
    })
}

function handleStart(evt) {
    let x = evt.touches[0].clientX
    let y = evt.touches[0].clientY
    let sideX = 0
    let sideY = 0
    if (x < innerWidth / 3)
        sideX = -1
    else if (x > innerWidth / 3 * 2)
        sideX = 1

    if (y < innerHeight / 3)
        sideY = -1
    else if (y > innerHeight / 3 * 2)
        sideY = 1

    if (x > innerWidth / 2)
        shot = 2
    else
        shot = 1

    touchPressing = true
    lastTouch.x = sideX
    lastTouch.y = sideY

    if (sideX == 1 && sideY == 1) {
        var audio = new Audio("img/trap.mp3")
        audio.play()
    }
}


function max(a, b) {
    return a > b ? a : b
}

function drawRotatedImage(image, x, y, sizeX, sizeY, angle) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.drawImage(image, -(sizeX / 2), -(sizeY / 2), sizeX, sizeY)
    //ctx.strokeRect(-(sizeX / 2), -(sizeY / 2), sizeX, sizeY)
    ctx.restore()
}

function renderField() {
    for (let i = -fields[0].width; i < canv.width + fields[0].width; i += fields[0].width) {
        for (let j = -fields[0].height; j < canv.height + fields[0].height; j += fields[0].height) {
            ctx.save()
            ctx.translate(offset - Camera.pos.x % fields[0].width, offset - Camera.pos.y % fields[0].height)
            //ctx.scale(0.5, 0.5)
            ctx.drawImage(fields[0], i, j)
            ctx.restore()
        }
    }
}

function renderEntities() {
    //ctx.transform(1, 0, 0, -1, 0, canv.height)
    let you = entities.filter(ent => ent.id == ws.id)[0]
    Camera.pos = Object.assign({}, you.pos)

    for (let ent of entities) {
        if (ent.pos.x >= (Camera.pos.x - window.innerWidth / 2 - max(ent.size.x, ent.size.y)) && ent.pos.x <= (Camera.pos.x + window.innerWidth / 2 + max(ent.size.x, ent.size.y))
            && ent.pos.y >= (Camera.pos.y - window.innerHeight / 2 - max(ent.size.x, ent.size.y)) && ent.pos.y <= (Camera.pos.y + window.innerHeight / 2 + max(ent.size.x, ent.size.y))) {
            let sprite = sprites.ship
            if (ent.type == "Bullet") {
                sprite = sprites.bullet
            }
            if (ent.type == "Island") {
                sprite = sprites.island
            }
            drawRotatedImage(sprite,
                ent.pos.x - Camera.pos.x + window.innerWidth / 2,
                ent.pos.y - Camera.pos.y + window.innerHeight / 2, ent.size.x, ent.size.y, ent.angle)

            ctx.strokeStyle = "black"
            ctx.lineWidth = 2
            ctx.fillStyle = "red"

            hpbaroffset = {
                x: -50,
                y: -80
            }
            if (ent.type != "Bullet") {
                ctx.fillRect(ent.pos.x - Camera.pos.x + window.innerWidth / 2 + hpbaroffset.x,
                    ent.pos.y - Camera.pos.y + window.innerHeight / 2 + hpbaroffset.y, 100 * ent.hp / ent.maxHp, 10)
                ctx.strokeRect(ent.pos.x - Camera.pos.x + window.innerWidth / 2 + hpbaroffset.x,
                    ent.pos.y - Camera.pos.y + window.innerHeight / 2 + hpbaroffset.y, 100, 10)
                ctx.drawImage(sprites.teams[ent.team], ent.pos.x - Camera.pos.x + window.innerWidth / 2 + hpbaroffset.x - 50,
                    ent.pos.y - Camera.pos.y + window.innerHeight / 2 + hpbaroffset.y - 27.5, 40, 40)
                if (ent.type == "Player") {
                    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
                    ctx.fillRect(ent.pos.x - Camera.pos.x + window.innerWidth / 2 + hpbaroffset.x,
                        ent.pos.y - Camera.pos.y + window.innerHeight / 2 + hpbaroffset.y - 30, 100, 15)
                    ctx.fillStyle = "white"
                    ctx.strokeStyle = "white"
                    ctx.font = "15px helvetica"
                    let n = ent.nickName
                    ctx.fillText(n,
                        ent.pos.x - Camera.pos.x + window.innerWidth / 2 + hpbaroffset.x,
                        ent.pos.y - Camera.pos.y + window.innerHeight / 2 + hpbaroffset.y - 30 + 12)
                }
            }
        }
    }
}

function shot1() {
    ws.sendRequest("makeShot", 1)
}

function shot2() {
    ws.sendRequest("makeShot", 2)
}

function renderButtons() {
    let center = 0.5 * canv.width
    let leftButtonCoords = {
        x: center - 0.05 * canv.width,
        y: 0.8 * canv.height
    }

    let leftSprite = sprites.buttonL
    let rightSprite = sprites.buttonR

    if (lastMousePosition.x >= leftButtonCoords.x && lastMousePosition.x <= leftButtonCoords.x + 0.05 * canv.width &&
        lastMousePosition.y >= leftButtonCoords.y && lastMousePosition.y <= leftButtonCoords.y + 0.05 * canv.width) {
        leftSprite = sprites.buttonLhover
    }

    if (highlight.left) {
        leftSprite = sprites.buttonLpressed
        setTimeout(() => {
            highlight.left = false
        }, 100)
    }

    ctx.fillStyle = "white"
    if (lastMousePosition.x >= leftButtonCoords.x + 0.1 * canv.width && lastMousePosition.x <= leftButtonCoords.x + 0.05 * canv.width + 0.1 * canv.width &&
        lastMousePosition.y >= leftButtonCoords.y && lastMousePosition.y <= leftButtonCoords.y + 0.05 * canv.width) {
        rightSprite = sprites.buttonRhover
    }

    if (highlight.right) {
        rightSprite = sprites.buttonRpressed
        setTimeout(() => {
            highlight.right = false
        }, 100)
    }

    let you = entities.filter(ent => ent.id == ws.id)[0]
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.drawImage(leftSprite, leftButtonCoords.x, leftButtonCoords.y, 0.05 * canv.width, 0.05 * canv.width)
    ctx.fillRect(leftButtonCoords.x, leftButtonCoords.y, 0.05 * canv.width, 0.05 * canv.width * you.leftShotTimer / you.shotCooldown)
    ctx.drawImage(rightSprite, leftButtonCoords.x + 0.1 * canv.width, leftButtonCoords.y, 0.05 * canv.width, 0.05 * canv.width)
    ctx.fillRect(leftButtonCoords.x + 0.1 * canv.width, leftButtonCoords.y, 0.05 * canv.width, 0.05 * canv.width * you.rightShotTimer / you.shotCooldown)

    ctx.fillStyle = "red"
    ctx.strokeStyle = "black"
    ctx.font = "3vh helvetica"
    if (you.outside) {
        ctx.fillText("TURN BACK", 0.4 * canv.width, 0.05 * canv.height)
    }
    if (you.respTimer > 0) {
        ctx.fillText(`YOU ARE DEAD ${you.respTimer}`, 0.4 * canv.width, 0.1 * canv.height)
    }
    if (you.resetTicks > 0) {
        ctx.fillText(`RESTARTING IN ${you.resetTicks}`, 0.4 * canv.width, 0.15 * canv.height)
    }
}

function renderMinimap() {
    let mapCanv = document.getElementById('mapCanvas')
    let mctx = mapCanv.getContext('2d')

    mctx.strokeStyle = "black"
    mctx.lineWidth = 5
    let size = 0.25 * canv.width

    mapCanv.width = size
    mapCanv.height = size

    mctx.fillStyle = "rgb(65, 105, 225)"
    mctx.fillRect(0, 0, size, size)
    let visionRadius = 0.05 * canv.width

    let myTeam = entities.filter(ent => ent.team == entities.filter(ent => ent.id == ws.id)[0].team && ent.type != "Bullet").map(ent => ent.pos)
    for (let pos of myTeam) {
        let mapCoords = {
            x: (pos.x + mapSize.x) / mapSize.x * size / 2,
            y: (pos.y + mapSize.y) / mapSize.y * size / 2
        }

        mctx.fillStyle = "rgb(95, 135, 255)"
        mctx.beginPath()
        mctx.ellipse(mapCoords.x, mapCoords.y, visionRadius, visionRadius, 0, 0, 2 * Math.PI)
        mctx.fill()
    }


    for (let ent of entities) {
        let mapCoords = {
            x: (ent.pos.x + mapSize.x) / mapSize.x * size / 2,
            y: (ent.pos.y + mapSize.y) / mapSize.y * size / 2
        }
        let good = myTeam.filter(pos => distance(pos, ent.pos) <= visionRadius / size * mapSize.x * 2)
        if (ent.type == "Island" || good.length > 0) {
            mctx.save()
            mctx.translate(mapCoords.x, mapCoords.y)
            mctx.rotate(ent.angle)

            mctx.lineWidth = 1
            if (ent.id == ws.id) {
                mctx.lineWidth = 4
            }
            mctx.strokeStyle = "black"
            mctx.fillStyle = (['blue', 'red'])[ent.team]
            mctx.fillRect(-ent.size.x / 20, -ent.size.y / 20, ent.size.x / 10, ent.size.y / 10)
            mctx.strokeRect(-ent.size.x / 20, -ent.size.y / 20, ent.size.x / 10, ent.size.y / 10)
            mctx.restore()
        }
    }
    mctx.drawImage(sprites.minimap, 0, 0, size, size)
}

function renderGold() {
    ctx.strokeStyle = "black"
    ctx.lineWidth = 10

    let menuCoords = {
        x: 0 * canv.width,
        y: 0 * canv.height
    }
    ctx.fillStyle = "black"
    ctx.font = `${Math.round(0.05 * canv.height)}px helvetica`
    let textCoords = {
        x: menuCoords.x + 0.025 * canv.width,
        y: menuCoords.y + 0.1 * canv.height
    }

    let you = entities.filter(ent => ent.id === ws.id)[0];

    let myTeamGold = 0
    let otherTeamGold = 0
    for (let ent of entities) {
        if (ent.team == you.team) {
            myTeamGold += ent.gold
        } else {
            otherTeamGold += ent.gold
        }
    }

    ctx.fillText(`${myTeamGold}(${you.gold}) | ${otherTeamGold}`, textCoords.x, textCoords.y)
    ctx.fillText(`${you.maxGold}`, textCoords.x, textCoords.y + (canv.height * 0.05))
    ctx.drawImage(sprites.paraNeko, 0.8 * canv.width, canv.height * 0.8, 0.3 * canv.height, 0.3 * canv.height)
}

function render() {
    canv.width = window.innerWidth
    canv.height = window.innerHeight

    if (touchPressing) {
        if (lastTouch.x == -1 && lastTouch.y == 0)
            ws.sendRequest("turn", 1)
        else if (lastTouch.x == 1 && lastTouch.y == 0)
            ws.sendRequest("turn", 2)
        else if (lastTouch.x == 0 && lastTouch.y == -1)
            ws.sendRequest("accelerate", true)
        else if (lastTouch.x == 0 && lastTouch.y == 1)
            ws.sendRequest("accelerate", false)
        else if (lastTouch.x == 0 && lastTouch.y == 0)
            ws.sendRequest("makeShot", shot)
    }

    ctx.clearRect(0, 0, canv.width, canv.height)
    renderField()
    renderEntities()
    renderGold()
    renderMinimap()
    renderButtons()
}

window.onload = async () => {

    await showAD()
    while (nickname === '') {
        nickname = prompt('Enter your nickname')
    }
    setTimeout(() => {
        ws.sendRequest('setNickname', nickname)
    }, 100)
    init()
    setInterval(render, 34)
    setInterval(() => {
        offset += animationCoef
        if (Math.abs(offset) >= 10) {
            animationCoef *= -1
        }
    }, 100)
}
// })();