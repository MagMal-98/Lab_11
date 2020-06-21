var gl;
var shaderProgram;
var uPMatrix;
var vertexWoodPositionBuffer;
var vertexColorBuffer;
var vertexCoordsBuffer;
var vertexNormalBuffer;

function MatrixMul(a,b) //Mnożenie macierzy
{
    let c = [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0
    ];
    for(let i=0;i<4;i++)
    {
        for(let j=0;j<4;j++)
        {
            c[i*4+j] = 0.0;
            for(let k=0;k<4;k++)
            {
                c[i*4+j]+= a[i*4+k] * b[k*4+j];
            }
        }
    }
    return c;
}

function CreateIdentytyMatrix()
{
    return [
        1,0,0,0, //Macierz jednostkowa
        0,1,0,0,
        0,0,1,0,
        0,0,0,1
    ];
}

function CreateTranslationMatrix(tx,ty,tz)
{
    return  [
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        tx,ty,tz,1
    ];
}

function CreateScaleMatrix(sx,sy,sz)
{
    return [
        sx,0,0,0,
        0,sy,0,0,
        0,0,sz,0,
        0,0,0,1
    ];
}

function CreateRotationZMatrix(angleZ)
{
    return [
        +Math.cos(angleZ*Math.PI/180.0),+Math.sin(angleZ*Math.PI/180.0),0,0,
        -Math.sin(angleZ*Math.PI/180.0),+Math.cos(angleZ*Math.PI/180.0),0,0,
        0,0,1,0,
        0,0,0,1
    ];
}

function CreateRotationYMatrix(angleY)
{
    return [
        +Math.cos(angleY*Math.PI/180.0),0,-Math.sin(angleY*Math.PI/180.0),0,
        0,1,0,0,
        +Math.sin(angleY*Math.PI/180.0),0,+Math.cos(angleY*Math.PI/180.0),0,
        0,0,0,1
    ];
}

function CreateRotationXMatrix(angleX)
{
    return [
        1,0,0,0,
        0,+Math.cos(angleX*Math.PI/180.0),+Math.sin(angleX*Math.PI/180.0),0,
        0,-Math.sin(angleX*Math.PI/180.0),+Math.cos(angleX*Math.PI/180.0),0,
        0,0,0,1
    ];
}

function createNormal(p1x,p1y,p1z,p2x,p2y,p2z,p3x,p3y,p3z) //Wyznaczenie wektora normalnego dla trójkąta
{
    let v1x = p2x - p1x;
    let v1y = p2y - p1y;
    let v1z = p2z - p1z;

    let v2x = p3x - p1x;
    let v2y = p3y - p1y;
    let v2z = p3z - p1z;

    let v3x =  v1y*v2z - v1z*v2y;
    let v3y =  v1z*v2x - v1x*v2z;
    let v3z =  v1x*v2y - v1y*v2x;

    vl = Math.sqrt(v3x*v3x+v3y*v3y+v3z*v3z); //Obliczenie długości wektora

    v3x/=vl; //Normalizacja na zakreś -1 1
    v3y/=vl;
    v3z/=vl;

    let vertexNormal = [v3x,v3y,v3z, v3x,v3y,v3z, v3x,v3y,v3z];
    return vertexNormal;
}

function createRect(mx,my,mz,dax,day,daz,dbx,dby,dbz)
{
    p1x = mx;             p1y = my;             p1z = mz;
    p2x = mx + dax;       p2y = my + day;       p2z = mz + daz;
    p3x = mx + dbx;       p3y = my + dby;       p3z = mz + dbz;
    p4x = mx + dax + dbx; p4y = my + day + dby; p4z = mz + daz + dbz;

    let vertexPosition = [p1x,p1y,p1z, p2x,p2y,p2z, p4x,p4y,p4z,  //Pierwszy trójkąt
        p1x,p1y,p1z, p4x,p4y,p4z, p3x,p3y,p3z]; //Drugi trójkąt

    return vertexPosition;
}

function CreateBox(x,y,z,dx,dy,dz)
{
    //Opis sceny 3D, położenie punktów w przestrzeni 3D w formacie X,Y,Z
    let vertexPosition = []; //3 punkty po 3 składowe - X1,Y1,Z1, X2,Y2,Z2, X3,Y3,Z3 - 1 trójkąt
    let vertexNormal = [];
    let vertexColor = [];

    vertexPosition.push(...createRect(-1,-1,-1,0,2,0,2,0,0));
    vertexPosition.push(...createRect(-1,-1,-1,0,0,2,0,2,0));
    vertexPosition.push(...createRect(-1,-1,-1,2,0,0,0,0,2));

    vertexPosition.push(...createRect(1,1,1,-2,0,0,0,-2,0));
    vertexPosition.push(...createRect(1,1,1,0,-2,0,0,0,-2));
    vertexPosition.push(...createRect(1,1,1,0,0,-2,-2,0,0));

    for(let i=0;i<vertexPosition.length;i=i+9)
    {
        vertexNormal.push(...createNormal(vertexPosition[i+0],vertexPosition[i+1],vertexPosition[i+2],vertexPosition[i+3],vertexPosition[i+4],vertexPosition[i+5],vertexPosition[i+6],vertexPosition[i+7],vertexPosition[i+8]));
    }

    for(let i=0;i<vertexPosition.length;i=i+1)
    {
        vertexColor.push(...[0.4,0.14,0.0]);
    }
    return [vertexPosition, vertexNormal, vertexColor];
}

function CreatePointCloud(sx,ex,sy,ey,sz,ez,svx,evx,svy,evy,svz,evz,sa,ea,n)
{
    let vertexPos   = [];
    let vertexVelocity = [];
    let vertexColor = [];
    let vertexAge = [];
    for(let i=0;i<n;i++)
    {
        //Position randomization
        let px = sx + Math.random()*(ex-sx);
        let py = sy + Math.random()*(ey-sy);
        let pz = sz + Math.random()*(ez-sz);
        //Velocity randomization
        let vx = svx; // + Math.random()*(evx-svx);
        let vy = svy; // + Math.random()*(evy-svy);
        let vz = svz; // + Math.random()*(evz-svz);

        let age = sa + Math.random()*(ea-sa);

        vertexPos.push(...[px,py,pz]);
        vertexVelocity.push(...[vx,vy,vz]);
        vertexColor.push(...[1.0,1.0,0.0]);

        vertexAge.push(age);
    }
    return [vertexPos,vertexVelocity,vertexColor,vertexAge];
}

//Opis sceny 3D, położenie punktów w przestrzeni 3D w formacie X,Y,Z
let vertexWoodPosition = []; //3 punkty po 3 składowe - X1,Y1,Z1, X2,Y2,Z2, X3,Y3,Z3 - 1 trójkąt
let vertexPosition = []; //3 punkty po 3 składowe - X1,Y1,Z1, X2,Y2,Z2, X3,Y3,Z3 - 1 trójkąt
let vertexVelocity;
let vertexColor = [];
let vertexWoodColor = [];
let vertexAge;

let sx = -1.0; //Położenie cząsteczek
let ex =  1.0;
let sy =  0.0;
let ey =  0.1;
let sz = -0.5;
let ez =  0.5;
let svx = -2.0; //Predkości cząsteczek
let evx =  2.0;
let svy =  5.0;
let evy =  2.0;
let svz = -2.0;
let evz = 2.0;
let sa = 0.2; //Czas życia nowych cząsteczek
let ea = 0.8;

function updatePointCloud(vertexPosition,vertexVelocity,vertexColor,vertexAge,n,dt, sx,ex,sy,ey,sz,ez,svx,evx,svy,evy,svz,evz,sa,ea)
{
    for(let i=0 ;i<n; i++)
    {
        vertexPosition[i*3+0] = vertexPosition[i*3+0] + vertexVelocity[i*3+0]*dt;
        vertexPosition[i*3+1] = vertexPosition[i*3+1] + vertexVelocity[i*3+1]*dt;
        vertexPosition[i*3+2] = vertexPosition[i*3+2] + vertexVelocity[i*3+2]*dt;

        vertexColor[i*3+1] = vertexAge[i]/(ea/2.0);

        if(vertexColor[i*3+1] < 0.2){
            vertexColor[i*3+0] = vertexAge[i]/(ea/20);
        }

        vertexAge[i] = vertexAge[i] - dt;
        if(vertexAge[i]<0)
        {
            vertexPosition[i*3+0] = sx + Math.random()*(ex-sx);
            vertexPosition[i*3+1] = sy + Math.random()*(ey-sy);
            vertexPosition[i*3+2] = sz + Math.random()*(ez-sz);
            //Velocity randomization
            vertexVelocity[i*3+0] = svx + Math.random()*(evx-svx);
            vertexVelocity[i*3+1] = svy + Math.random()*(evy-svy);
            vertexVelocity[i*3+2] = svz + Math.random()*(evz-svz);

            vertexColor[i*3+0] = 1.0;
            vertexColor[i*3+1] = 1.0;
            vertexColor[i*3+2] = 0.0;

            vertexAge[i] = sa + Math.random()*(ea-sa);
        }
    }
    return [vertexPosition,vertexVelocity,vertexColor,vertexAge];
}

function startGL()
{
    let canvas = document.getElementById("canvas3D"); //wyszukanie obiektu w strukturze strony
    gl = canvas.getContext("experimental-webgl"); //pobranie kontekstu OpenGL'u z obiektu canvas
    gl.viewportWidth = canvas.width; //przypisanie wybranej przez nas rozdzielczości do systemu OpenGL
    gl.viewportHeight = canvas.height;

    //Kod shaderów
    const vertextShaderSource = ` //Znak akcentu z przycisku tyldy - na lewo od przycisku 1 na klawiaturze
    precision highp float;
    attribute vec3 aVertexPosition; 
    attribute vec3 aVertexColor;
    uniform mat4 uMMatrix;
    uniform mat4 uVMatrix;
    uniform mat4 uPMatrix;
    varying vec3 vPos;
    varying vec3 vColor;
    void main(void) {
      vPos = vec3(uMMatrix * vec4(aVertexPosition, 1.0));
      gl_Position = uPMatrix * uVMatrix * vec4(vPos,1.0); //Dokonanie transformacji położenia punktów z przestrzeni 3D do przestrzeni obrazu (2D)
      vColor = aVertexColor;
      gl_PointSize = 5.0;
    }
  `;
    const fragmentShaderSource = `
    precision highp float;
    varying vec3 vPos;
    varying vec3 vColor;
    void main(void) {
      gl_FragColor = vec4(vColor,1.0);
    }
  `;
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); //Stworzenie obiektu shadera
    let vertexShader   = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource); //Podpięcie źródła kodu shader
    gl.shaderSource(vertexShader, vertextShaderSource);
    gl.compileShader(fragmentShader); //Kompilacja kodu shader
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) { //Sprawdzenie ewentualnych błedów kompilacji
        alert(gl.getShaderInfoLog(fragmentShader));
        return null;
    }
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(vertexShader));
        return null;
    }

    shaderProgram = gl.createProgram(); //Stworzenie obiektu programu
    gl.attachShader(shaderProgram, vertexShader); //Podpięcie obu shaderów do naszego programu wykonywanego na karcie graficznej
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) alert("Could not initialise shaders");  //Sprawdzenie ewentualnych błedów

    let vertexNormal = [];
    let vertexPositionTMP, vertexNormalTMP, vertexVelocityTMP, vertexColorTMP, vertexAgeTMP;
    [vertexPositionTMP, vertexNormalTMP, vertexColorTMP] = CreateBox(0,0,0,1,1,1);
    vertexWoodColor.push(...vertexColorTMP);
    vertexWoodPosition.push(...vertexPositionTMP);
    vertexNormal = vertexNormalTMP;

    [vertexPositionTMP, vertexVelocityTMP, vertexColorTMP, vertexAgeTMP] = CreatePointCloud(sx,ex,sy,ey,sz,ez,svx,evx,svy,evy,svz,evz,sa,ea,1000);
    vertexPosition.push(...vertexPositionTMP);
    vertexVelocity = vertexVelocityTMP;
    vertexColor.push(...vertexColorTMP);
    vertexAge = vertexAgeTMP;

    vertexWoodPositionBuffer = gl.createBuffer(); //Stworzenie tablicy w pamieci karty graficznej
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexWoodPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexWoodPosition), gl.STATIC_DRAW);
    vertexWoodPositionBuffer.itemSize = 3; //zdefiniowanie liczby współrzednych per wierzchołek
    vertexWoodPositionBuffer.numItems = vertexWoodPosition.length/9; //Zdefinoiowanie liczby trójkątów w naszym buforze

    vertexPositionBuffer = gl.createBuffer(); //Stworzenie tablicy w pamieci karty graficznej
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3; //zdefiniowanie liczby współrzednych per wierzchołek
    vertexPositionBuffer.numItems = vertexPosition.length/9; //Zdefinoiowanie liczby trójkątów w naszym buforze

    vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormal), gl.STATIC_DRAW);
    vertexNormalBuffer.itemSize = 3;
    vertexNormalBuffer.numItems = vertexNormal.length/9;

    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColor), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 3;
    vertexColorBuffer.numItems = vertexColor.length/9;

    vertexWoodColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexWoodColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexWoodColor), gl.STATIC_DRAW);
    vertexWoodColorBuffer.itemSize = 3;
    vertexWoodColorBuffer.numItems = vertexWoodColor.length/9;

    //Macierze opisujące położenie wirtualnej kamery w przestrzenie 3D
    let aspect = gl.viewportWidth/gl.viewportHeight;
    let fov = 45.0 * Math.PI / 180.0; //Określenie pola widzenia kamery
    let zFar = 100.0; //Ustalenie zakresów renderowania sceny 3D (od obiektu najbliższego zNear do najdalszego zFar)
    let zNear = 0.1;
    uPMatrix = [
        1.0/(aspect*Math.tan(fov/2)),0                           ,0                         ,0                            ,
        0                         ,1.0/(Math.tan(fov/2))         ,0                         ,0                            ,
        0                         ,0                           ,-(zFar+zNear)/(zFar-zNear)  , -1,
        0                         ,0                           ,-(2*zFar*zNear)/(zFar-zNear) ,0.0,
    ];
    Tick();
}

//let angle = 45.0; //Macierz transformacji świata - określenie położenia kamery
var angleZ = 0.0;
var angleY = 0.0;
var angleX = 0.0;
var KameraPositionZ = -10.0;
var KameraPositionX =  0.0;
var KameraPositionY = -2.0;

function Tick()
{
    [vertexPosition, vertexVelocity, vertexColor, vertexAge] = updatePointCloud(vertexPosition,vertexVelocity,vertexColor,vertexAge,1000,0.01, sx,ex,sy,ey,sz,ez,svx,evx,svy,evy,svz,evz,sa,ea);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColor), gl.STATIC_DRAW);

    let uMMatrix0 = CreateIdentytyMatrix();
    let uMMatrix1 = CreateIdentytyMatrix();
    let uMMatrix2 = CreateIdentytyMatrix();
    let uMMatrix3 = CreateIdentytyMatrix();

    let uVMatrix = CreateIdentytyMatrix();

    uVMatrix = MatrixMul(uVMatrix,CreateRotationXMatrix(angleX));
    uVMatrix = MatrixMul(uVMatrix,CreateRotationYMatrix(angleY));
    uVMatrix = MatrixMul(uVMatrix,CreateRotationZMatrix(angleZ));
    uVMatrix = MatrixMul(uVMatrix,CreateTranslationMatrix(KameraPositionX,KameraPositionY,KameraPositionZ));

    //wood1
    uMMatrix1 = MatrixMul(uMMatrix1,CreateScaleMatrix(1.3,0.2,0.1));
    uMMatrix1 = MatrixMul(uMMatrix1,CreateTranslationMatrix(0.0,0.0,0.0));
    uMMatrix1 = MatrixMul(uMMatrix1,CreateRotationXMatrix(0.0));
    uMMatrix1 = MatrixMul(uMMatrix1,CreateRotationYMatrix(20.0));
    uMMatrix1 = MatrixMul(uMMatrix1,CreateRotationZMatrix(10.0));

    //wood2
    uMMatrix2 = MatrixMul(uMMatrix2,CreateScaleMatrix(1.3,0.2,0.1));
    uMMatrix2 = MatrixMul(uMMatrix2,CreateTranslationMatrix(0.0,0.0,0.0));
    uMMatrix2 = MatrixMul(uMMatrix2,CreateRotationXMatrix(0.0));
    uMMatrix2 = MatrixMul(uMMatrix2,CreateRotationYMatrix(-20.0));
    uMMatrix2 = MatrixMul(uMMatrix2,CreateRotationZMatrix(-10.0));

    //cloud
    uMMatrix3 = MatrixMul(uMMatrix3,CreateTranslationMatrix(0.0,0.0,0.0));

    //Render Scene
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.0,0.0,0.0,1.0); //Wyczyszczenie obrazu kolorem czerwonym
    gl.clearDepth(1.0);             //Wyczyścienie bufora głebi najdalszym planem
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgram);  //Użycie przygotowanego programu shaderowego

    gl.enable(gl.DEPTH_TEST);           // Włączenie testu głębi - obiekty bliższe mają przykrywać obiekty dalsze
    gl.depthFunc(gl.LEQUAL);            //

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uPMatrix"), false, new Float32Array(uPMatrix)); //Wgranie macierzy kamery do pamięci karty graficznej
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uVMatrix"), false, new Float32Array(uVMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMMatrix"), false, new Float32Array(uMMatrix1));

    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexPosition"));  //Przekazanie położenia
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexWoodPositionBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexPosition"), vertexWoodPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexNormal"));  //Przekazywanie wektorów normalnych
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexNormal"), vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexColor"));  //Przekazywanie wektorów colorów
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexWoodColorBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexColor"), vertexWoodColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //wood1
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMMatrix"), false, new Float32Array(uMMatrix1));
    gl.uniform3f(gl.getUniformLocation(shaderProgram, "uColor"),0.4,0.15,0.0);
    gl.drawArrays(gl.TRIANGLES, 0, vertexWoodPositionBuffer.numItems*vertexWoodPositionBuffer.itemSize); //Faktyczne wywołanie rendrowania

    //wood2
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMMatrix"), false, new Float32Array(uMMatrix2));
    gl.uniform3f(gl.getUniformLocation(shaderProgram, "uColor"),0.4,0.15,0.0);
    gl.drawArrays(gl.TRIANGLES, 0, vertexWoodPositionBuffer.numItems*vertexWoodPositionBuffer.itemSize); //Faktyczne wywołanie rendrowania

    //cloud
    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexPosition"));  //Przekazanie położenia
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexPosition"), vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexColor"));  //Przekazywanie wektorów colorów
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexColor"), vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMMatrix"), false, new Float32Array(uMMatrix3));
    gl.drawArrays(gl.POINTS, 0, vertexPositionBuffer.numItems*vertexPositionBuffer.itemSize); //Faktyczne wywołanie rendrowania

    setTimeout(Tick,100);
}