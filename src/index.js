import 'normalize.css';
import 'style.css';

import { z, page } from 'lib/2ombular';

import rough from 'roughjs';

document.title = 'serjik';

let canvas, parent;


const SIZE = 32;

const WIDTH = 16;
const HEIGHT = 24;

const rectangles = [];

let mousedown, mousemove, rect, cant, a, b;

let color = 'blue';

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
        let sx = Math.floor((Math.min(mousedown.clientX, mousemove.clientX) - x) / SIZE) * SIZE,
            sy = Math.floor((Math.min(mousedown.clientY, mousemove.clientY) - y) / SIZE) * SIZE,
            ex = Math.floor((Math.max(mousedown.clientX, mousemove.clientX) - x) / SIZE + 1) * SIZE,
            ey = Math.floor((Math.max(mousedown.clientY, mousemove.clientY) - y) / SIZE + 1) * SIZE;
        rect = canvas.rectangle(sx, sy, ex-sx, ey-sy, { strokeWidth: 2, stroke: color, fill: color});
    
        let newText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        newText.setAttributeNS(null, "stroke", color);
        let area = (ex-sx)*(ey-sy) / SIZE / SIZE + '';
        var textNode = document.createTextNode(area);
        newText.appendChild(textNode);
    
        const width = BrowserText.getWidth(area, 48);
    
        newText.setAttributeNS(null, "x", (sx + ex) / 2 - width / 2);    
        newText.setAttributeNS(null, "y", (sy + ey) / 2 + 16);
    
        rect.appendChild(newText)
    
        parent.appendChild(rect);
    
        rectangles.push(
            [color, sx, sy, ex, ey]
        );

        nextMove();
    }

    mousedown = null;
}

function nextMove() {
    a = Math.floor(Math.random() * 6 + 1);
    b = Math.floor(Math.random() * 6 + 1);
    
    color = ['blue', 'red'][+(color == 'blue')];

    page.update();
}

nextMove();

const svg = z._svg({
    width: (4+WIDTH*SIZE)+'px',
    height: (4+HEIGHT*SIZE)+'px',
    on$created(e) {
        parent = e.target;
        canvas = rough.svg(e.target);
        const stroke = '#777';
        parent.appendChild(
            canvas.rectangle(2, 2, WIDTH*SIZE, HEIGHT*SIZE, {stroke}));
        for (let x = 0; x < WIDTH; x++) {
            parent.appendChild(
                canvas.line(2+x*SIZE, 2, x*SIZE, HEIGHT*SIZE, {stroke}));
        }
        for (let y = 0; y < HEIGHT; y++) {
            parent.appendChild(
                canvas.line(2, 2+y*SIZE, WIDTH*SIZE, y*SIZE, {stroke}));
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
            let sx = Math.floor((Math.min(mousedown.clientX, mousemove.clientX) - x) / SIZE) * SIZE,
                sy = Math.floor((Math.min(mousedown.clientY, mousemove.clientY) - y) / SIZE) * SIZE,
                ex = Math.floor((Math.max(mousedown.clientX, mousemove.clientX) - x) / SIZE + 1) * SIZE,
                ey = Math.floor((Math.max(mousedown.clientY, mousemove.clientY) - y) / SIZE + 1) * SIZE;

            cant = false;
            if (rectangles.length < 2 && (sx != 0 || sy != 0) && (ex != WIDTH*SIZE || ey != HEIGHT*SIZE)) {
                cant = true;
            } else if (rectangles.length > 1) {
                let good;
                for (const [c, sx1, sy1, ex1, ey1] of rectangles) {
                    if (sx1 < ex && ex1 > sx && sy1 < ey && ey1 > sy) {
                        cant = true;
                        break;
                    }
                    if (c == color && (
                        (ex1 > sx && sx1 < ex && (ey1 == sy || sy1 == ey)) ||
                        (ey1 > sy && sy1 < ey && (ex1 == sx || sx1 == ex))
                    )) {
                        good = true;
                    }
                }
                if (!good) cant = true;
            }

            let w = (ex - sx) / SIZE;
            let h = (ey - sy) / SIZE;

            if ((w != a || h != b) && (h != a || w != b))
                cant = true;
            
            let oldc = color;
            if (cant)
                color = '#333'
            rect = canvas.rectangle(2+sx, 2+sy, ex-sx, ey-sy, {fill: cant ? color : undefined, strokeWidth: 2, stroke: color});

            let newText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            newText.setAttributeNS(null, "stroke", color);
            let area = (ex-sx)*(ey-sy) / SIZE / SIZE + '';
            var textNode = document.createTextNode(area);
            newText.appendChild(textNode);

            const width = BrowserText.getWidth(area, 48);

            newText.setAttributeNS(null, "x", (sx + ex) / 2 - width / 2);    
            newText.setAttributeNS(null, "y", (sy + ey) / 2 + 16);

            rect.appendChild(newText)

            parent.appendChild(rect);

            if (cant)
                color = oldc;
        }
    }
})

const roll = z._button({
    onclick: nextMove
}, 'Skip turn')

function cumsum(c) {
    return rectangles.filter(i=>i[0]==c).reduce((a, b) => a+(b[3]-b[1])*(b[4]-b[2])/SIZE/SIZE, 0);
}

const Body = z._(
    svg, roll,
    _=>z.f1(`${a}, ${b}`),
    _=>z.f1('Now is ', z._span({style:'color:'+color}, color), ' turn'),
    _=>z.f1(z._span({style:'color:blue'}, 'Blue'), ': ' + cumsum('blue')),
    _=>z.f1(z._span({style:'color:red'}, 'Red'), ': '+ cumsum('red')),
);

page.setBody(Body)
