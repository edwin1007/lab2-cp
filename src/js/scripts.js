import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

/**crea una nueva escena*/
const scene = new THREE.Scene();

/**crea la camara de vision */
const camera = new THREE.PerspectiveCamera( 
    45, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000 
);

/**crea un plano cartesiano */
const orbit = new OrbitControls(camera, renderer.domElement);
const axesHelper = new THREE.AxesHelper(40);
scene.add(axesHelper);
camera.position.set( 0, 0, 80 );
orbit.update();
//camera.lookAt( 0, 0, 0 );

/**crea una grilla como sistema de referencia */
const gridHelper = new THREE.GridHelper(
    60, 
    60, 
    {color: 0xF00000}
);

/**agrega la grilla */
scene.add(gridHelper);
gridHelper.rotation.x = -0.5 * Math.PI;

/**crea un plano de tamaño 1x1 para representar un pixel */
function pixel(x, y, c){
    var pix = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            visible: true
        }),
    )
    pix.position.set(x + c, y + c);
    scene.add(pix);
}

/**creacion del objeto: geometria y material*/
const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );

/**arreglo para almacenar las coordenadas */
const points = [];

/**Algoritmo basico linea recta) */
function lineaRectaBasico(x0,  y0,  x1,  y1){
    var m = (y1-y0) / (x1-x0);
    var y = y0;
    var x = x0;
    var c = 0;

    points.push( new THREE.Vector2( x, y) );
    pixel(x, y, c); 

    for( var i=x0; i < x1; i++){
        y = y + m;
        x++;
        points.push( new THREE.Vector2( Math.round(x), Math.round(y) ) );
        pixel(Math.round(x), Math.round(y), c);
    }
}

/**Algoritmo DDA */
function DDA(x0, y0, x1, y1){
    var dx, dy, steps;
    var xinc, yinc;
    var x, y;
    var c = 0

    dx = x1 - x0;
    dy = y1 - y0;
    
    if (Math.abs(dx) > Math.abs(dy)){
        steps = Math.abs(dx);
    }
    else{
        steps = Math.abs(dy);
    }
    
    xinc = dx / steps;
    yinc = dy / steps;
    x = x0;
    y = y0;
    pixel(x, y, c);
    
    for(var i=0; i<steps; i++){
        x = x + xinc;
        y = y + yinc;
        pixel(Math.round(x), Math.round(y), c);
    }
} 

function lineaRectaBresenham( x0, y0, x1, y1 ){
    var dx, dy;
    var pk;
    var x, y;
    var c = 0;

    x = x0;
    y = y0;
    dx = x1-x0;
    dy = y1-y0; 
    pk = 2*dy - dx;
    pixel(x, y, c); 
    
    for(var i=0; i < dx; i++){ 
        if (pk < 0){
            x = x + 1;
            y = y;
            pk = pk + 2*dy;
        }
        else{
            x = x + 1;
            y = y + 1;
            pk = pk + 2*dy - 2*dx;
        }
        pixel(x, y, c);
    }
}

function puntoMedio( x0, y0, r){
    var x, y, pk;
    var c = 0;
    var puntos = [];
    var coor = [];

    x = x0 - x0; // se calcula para pintar el circulo en (0, 0)
    y = y0 - y0 + r; // se calcula para pintar el circulo en (0, 0)
    pk = 1 - r;    

    pixel(x0, y0, c); //pinta el centro
    puntos.push(new THREE.Vector2(x, y));
    pixel(x + x0, y + y0, c); 
    console.log(x + x0, y + y0, pk);
    
    while(x < y - 1){           
        if(pk < 0){
            x = x + 1;
            y = y;
            pk = pk + 2*x + 1;
        }
        else{
            x = x + 1;
            y = y - 1;
            pk = pk - 2*y + 2*x;
        }
        puntos.push(new THREE.Vector2(x, y));
        pixel(x + x0, y + y0, c)  
        console.log(x + x0, y + y0, pk);
    }

    /**copia el arreglo: salida del alg. punto medio*/
    for(var i=0; i<puntos.length; i++){
        coor[i] = puntos[i];
        //console.log(puntos[i].getComponent(0) + x0, puntos[i].getComponent(1) + y0);
    }

    //puntos.pop(); //elimina el ultimo elemento.
    //console.log(puntos); 
    puntos.reverse();
    console.log(puntos); 
    var m, n;

    for(var i=0; i<puntos.length; i++){
        m = puntos[i].getComponent(1);
        n = puntos[i].getComponent(0);
        coor.push(new THREE.Vector2(m, n));
        pixel(m + x0, n + y0, c);  
    }
    //console.log(coor);

    for(var i=0; i<coor.length; i++){
        m = coor[i].getComponent(1);
        n = -1 * coor[i].getComponent(0);
        pixel(m + x0, n + y0, c);  
    }

    for(var i=0; i<coor.length; i++){
        m = -1 * coor[i].getComponent(1);
        n = -1 * coor[i].getComponent(0);
        pixel(m + x0, n + y0, c);  
    }

    for(var i=0; i<coor.length; i++){
        m = -1 * coor[i].getComponent(1);
        n = coor[i].getComponent(0);
        pixel(m + x0, n + y0, c);  
    }

}

/**Algoritmo para circulos de Bresenham */
function circleBresenham( x0, y0){  
    var x, y, y, d;
    var c = 0;
    
    r = y0;
    d = 3 - 2*r;
    x = x0;
    y = y0 + r;
    
    pixel(x, y, c);    

    while(x < y){
        x++;
        if(d < 0){
            y = y;
            d = d + 4*x + 6;      
        }
        else{                
            d = d + 4*(x - y) + 10;    
            y = y - 1;
        }
        pixel(x, y, c);
    }
}

/**invoca la funcion con parametros iniciales x0, y0, x1, y1  */
//lineaRectaBasico(9, 18, 12, 26); 

/**invoca la fiuncion DDA */
//DDA(-1, 1, 3, 3);

/**invoca la fiuncion lineaRectaBresenham */
//lineaRectaBresenham(9, 18, 14, 22);

/**invoca la funcion puntoMedio */
puntoMedio(-2, -3, 8);

/**invoca el algoritmo circleBresenham */
//circleBresenham(0, 9);

/**dibuja la linea a escala de pixeles del pc */
const geometry = new THREE.BufferGeometry().setFromPoints( points );

/**construye el objeto linea */
const line = new THREE.Line( geometry, material );

/**agrega el objeto linea a la escena */
scene.add( line );
renderer.render( scene, camera );