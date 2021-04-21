import 'normalize.css';
import 'style.css';

import {page, z} from 'lib/2ombular';

import rough from 'roughjs';

document.title = 'serjik';

let canvas, parent;


const ONE_BOX_SIZE = 32;
const MAX_GUESS_ATTEMPTS = 100;

const WIDTH = 20;
const HEIGHT = 20;

const rectangles = [];

let mousedown, mousemove, rect, cant, diceOne, diceTwo;

let color = 'blue';
let autoPlayMode = false;
let pvpMode = false;
let mirrorMode = false;

var BrowserText = (function () {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d');

    /**
     * Measures the rendered width of arbitrary text given the font size and font face
     * @param {string} text The text to measure
     * @param {number} fontSize The font size in pixels
     * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
     * @returns {number} The width of the text
     **/
    function getWidth(text, fontSize, fontFace) {
        context.font = fontSize + 'px ' + fontFace;
        return context.measureText(text).width;
    }

    return {
        getWidth: getWidth
    };
})();

function mouseup(e) {
    window.removeEventListener('mouseup', mouseup);
    parent.removeChild(rect);
    rect = null;
    if (!cant) {
        const {x, y} = parent.getBoundingClientRect();
        let sx = Math.floor((Math.min(mousedown.clientX, mousemove.clientX) - x) / ONE_BOX_SIZE),
            sy = Math.floor((Math.min(mousedown.clientY, mousemove.clientY) - y) / ONE_BOX_SIZE),
            ex = Math.floor((Math.max(mousedown.clientX, mousemove.clientX) - x) / ONE_BOX_SIZE + 1),
            ey = Math.floor((Math.max(mousedown.clientY, mousemove.clientY) - y) / ONE_BOX_SIZE + 1);

        drawAndSaveValidMove(sx, sy, ex, ey, color);
    }
    mousedown = null;
}

function addRectangle(side, startX, startY, endX, endY) {
    rectangles.push(
        {
            side: side,
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY
        }
    );
}

function drawAndSaveValidMove(startX, startY, endX, endY, withColor) {
    drawRectangleWithText(startX, startY, endX, endY, withColor);
    addRectangle(withColor, startX, startY, endX, endY);
    page.update();
    nextMove();
}

function tryMakingTwoMoves(endXgen, endYgen, drawColor) {
    let success = false;
    if (!isMoveForbidden(endXgen - diceOne, endYgen - diceTwo, endXgen, endYgen)) {
        drawAndSaveValidMove(endXgen - diceOne, endYgen - diceTwo, endXgen, endYgen, drawColor);
        success = true;
    } else if (!isMoveForbidden(endXgen - diceTwo, endYgen - diceOne, endXgen, endYgen)) {
        drawAndSaveValidMove(endXgen - diceTwo, endYgen - diceOne, endXgen, endYgen, drawColor);
        success = true;
    }
    return success;
}

function makeAutomaticMove() {
    if (tryMakingTwoMoves(WIDTH, HEIGHT, color)){
        return;
    }

    //try some random moves
    for (let i = 0; i < MAX_GUESS_ATTEMPTS; i++) {
        //just something for testing/filling field
        const endXgen = Math.floor(Math.random() * WIDTH + 1);
        const endYgen = Math.floor(Math.random() * HEIGHT + 1);
        if (tryMakingTwoMoves(endXgen, endYgen, color)){
            return;
        }
    }
    //just check every possible move
    for (let x =0; x < WIDTH; x++){
        for (let y =0; y < HEIGHT; y++){
            if (tryMakingTwoMoves(x, y, color)){
                return;
            }
        }
    }
    console.log('Skipping [' + diceOne + ',' + diceTwo + ']');
    nextMove();
}

function checkIfAutoMoveEnabled() {
    if (countSum('blue')+ countSum('red') === HEIGHT * WIDTH) {
        autoPlayMode = false;
        return false;
    } else if(autoPlayMode)
        return true;
    else if (color === 'blue' && !pvpMode)
        return true;
    return false;

}

function toggleAutoPlay() {
    if (rectangles.length > 1) {
        autoPlayMode = !autoPlayMode;
        page.update();
        makeAutomaticMove();
    }else {
        console.log('Autoplay lags when no rectangles present')
    }
}

function nextMove() {
    if (!(mirrorMode && color ==='red')) {
        diceOne = Math.floor(Math.random() * 6 + 1);
        diceTwo = Math.floor(Math.random() * 6 + 1);
    }

    color = ['blue', 'red'][+(color === 'blue')];

    page.update();
    if (checkIfAutoMoveEnabled()){
        makeAutomaticMove();
    }
}

nextMove();

function drawRectangleWithText(startX, startY, endX, endY, fillColor) {
    const startXpx = startX * ONE_BOX_SIZE;
    const startYpx = startY * ONE_BOX_SIZE;
    const endXpx = endX * ONE_BOX_SIZE;
    const endYpx = endY * ONE_BOX_SIZE;
    rect = canvas.rectangle(startXpx, startYpx, endXpx - startXpx, endYpx - startYpx, {strokeWidth: 2, stroke: color, fill: fillColor});

    let newText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    newText.setAttributeNS(null, "stroke", color);
    let area = (endXpx - startXpx) * (endYpx - startYpx) / ONE_BOX_SIZE / ONE_BOX_SIZE + '';
    const textNode = document.createTextNode(area);
    newText.appendChild(textNode);

    const width = BrowserText.getWidth(area, 48);

    newText.setAttributeNS(null, "x", (startXpx + endXpx) / 2 - width / 2);
    newText.setAttributeNS(null, "y", (startYpx + endYpx) / 2 + (ONE_BOX_SIZE/2));

    rect.appendChild(newText);

    parent.appendChild(rect);
}

function isMoveForbidden(sx, sy, ex, ey) {
    let moveIsInvalid = false;
    if(sx < 0 || sy < 0 || ex < 0 || ey < 0){
        moveIsInvalid = true;
    }if(sx > WIDTH || sy > HEIGHT || ex > WIDTH || ey > HEIGHT){
        moveIsInvalid = true;
    }else if (rectangles.length < 2 && (sx !== 0 || sy !== 0) && (ex !== WIDTH || ey !== HEIGHT)) {
        moveIsInvalid = true;
    } else if (rectangles.length > 1) {
        let good;
        for (const rectangle of rectangles) {
            if (rectangle.startX < ex && rectangle.endX > sx && rectangle.startY < ey && rectangle.endY > sy) {
                moveIsInvalid = true;
                break;
            }
            if (rectangle.side === color && (
                (rectangle.endX > sx && rectangle.startX < ex && (rectangle.endY === sy || rectangle.startY === ey)) ||
                (rectangle.endY > sy && rectangle.startY < ey && (rectangle.endX === sx || rectangle.startX === ex))
            )) {
                good = true;
            }
        }
        if (!good) moveIsInvalid = true;
    }

    let w = (ex - sx);
    let h = (ey - sy);

    if ((w !== diceOne || h !== diceTwo) && (h !== diceOne || w !== diceTwo))
        moveIsInvalid = true;

    return moveIsInvalid
}

const svg = z._svg({
    width: (4+WIDTH*ONE_BOX_SIZE)+'px',
    height: (4+HEIGHT*ONE_BOX_SIZE)+'px',
    on$created(e) {
        parent = e.target;
        canvas = rough.svg(e.target);
        const stroke = '#777';
        parent.appendChild(
            canvas.rectangle(2, 2, WIDTH*ONE_BOX_SIZE, HEIGHT*ONE_BOX_SIZE, {stroke}));
        for (let x = 0; x < WIDTH; x++) {
            parent.appendChild(
                canvas.line(2+x*ONE_BOX_SIZE, 2, x*ONE_BOX_SIZE, HEIGHT*ONE_BOX_SIZE, {stroke}));
        }
        for (let y = 0; y < HEIGHT; y++) {
            parent.appendChild(
                canvas.line(2, 2+y*ONE_BOX_SIZE, WIDTH*ONE_BOX_SIZE, y*ONE_BOX_SIZE, {stroke}));
        }
    },
    onmousedown(e) {
        mousedown = e;
        window.addEventListener('mouseup', mouseup);
        rect = canvas.rectangle(0, 0, 0, 0);
        parent.appendChild(rect);
        cant = true;
    },
    onmousemove(e) {
        mousemove = e;
        if (mousedown) {
            parent.removeChild(rect);

            const {x, y} = parent.getBoundingClientRect();
            let sx = Math.floor((Math.min(mousedown.clientX, mousemove.clientX) - x) / ONE_BOX_SIZE),
                sy = Math.floor((Math.min(mousedown.clientY, mousemove.clientY) - y) / ONE_BOX_SIZE),
                ex = Math.floor((Math.max(mousedown.clientX, mousemove.clientX) - x) / ONE_BOX_SIZE + 1),
                ey = Math.floor((Math.max(mousedown.clientY, mousemove.clientY) - y) / ONE_BOX_SIZE + 1);

            cant = isMoveForbidden(sx, sy, ex, ey);

            let oldColor = color;
            if (cant)
                color = '#333';

            drawRectangleWithText(sx,sy,ex,ey,cant ? color : undefined);

            if (cant)
                color = oldColor;
        }
    }
});

function enablePvP() {
    pvpMode = !pvpMode;
    page.update();
}
function enableMirrorMode() {
    mirrorMode = !mirrorMode;
    page.update();
}

function countSum(player) {
    return rectangles.filter(rectangle=>rectangle.side === player).reduce((a, b) => a+(b.endX-b.startX)*(b.endY-b.startY), 0);
}

function findWinner() {
    const half = HEIGHT*WIDTH/2;
    const redCount =  countSum('red');
    const blueCount =  countSum('blue');
    if (redCount > half) {
        return z._span({style:'color:red'}, 'Red wins');
    } else if (blueCount > half) {
        return z._span({style:'color:blue'}, 'Blue wins');
    }
    return  z._span({style:'color:black'}, 'No winner yet');
}

const Body = z._(
    svg,
    z._button({
        onclick: nextMove
    }, 'Skip turn'),
    z._button({
        onclick: enablePvP
    }, 'PvP Mode'),
    z._button({
        onclick: enableMirrorMode
    }, 'Mirror Mode'),
    z._button({
        onclick: toggleAutoPlay
    }, 'Auto Play'),
    _=>z.f1('Now is ', z._span({style:'color:'+color}, color), ' turn'),
    _=>z.f1(`${diceOne}, ${diceTwo}`),
    _=>z.f1('PvP: ' + (pvpMode ?'On':'Off')),
    _=>z.f1('Mirror: ' + (mirrorMode ?'On':'Off')),
    _=>z.f1(z._span({style:'color:blue'}, 'Blue'), ': ' + countSum('blue')),
    _=>z.f1(z._span({style:'color:red'}, 'Red'), ': '+ countSum('red')),
    _=>z.f1(findWinner()),

);

page.setBody(Body);
