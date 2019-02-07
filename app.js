// CPU vs GPU
// Where is what work done?


// Get reference to the canvas object
let canvas = document.getElementById('canvas');

// Get reference to the WebGL context
let gl = canvas.getContext('webgl');


/**
 * 
 * Define Geometry
 * 
 */

// Create a buffer to define points
// Buffer: A block of memory used for a specific purpose. 
//         Think of it a 2-D array covering the screen. 
const positionBuffer = gl.createBuffer();

// Create a coresponding buffer on the GPU
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Define the geometry of the square
const positions = [
     1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
    -1.0, -1.0,
];

// Send the data to the 
gl.bufferData(gl.ARRAY_BUFFER, 
              new Float32Array(positions), 
              gl.STATIC_DRAW);


/**
 * 
 * Define shader programs
 * 
 */

// Vertex shader program
const vsSource = `
attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uCameraViewMatrix;
void main() {
    gl_Position = uProjectionMatrix * uCameraViewMatrix * uModelViewMatrix * aVertexPosition;
}
`;

// Create shader object.
// Shader Types: VERTEX_SHADER - Affect position
//               FRAGMENT_SHADER - Affect color
const vertexShader = gl.createShader(gl.VERTEX_SHADER)

// Send the program to the shader object
gl.shaderSource(vertexShader, vsSource);

// Compile the shader source code
gl.compileShader(vertexShader);

// Check for compilation error
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
}

// Fragment shader program
const fsSource = `
void main() {
    gl_FragColor = vec4(0.4, 1.0, 1.0, 1.0);
}
`;

// Same pattern as the vertex shader
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fsSource);
gl.compileShader(fragmentShader);
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(fragmentShader);
}

// Create a shader program object
const shaderProgram = gl.createProgram();

// Add the vertex shader to the shader program
gl.attachShader(shaderProgram, vertexShader);

// Add the fragment shader to the vertex shader
gl.attachShader(shaderProgram, fragmentShader);

// Send the program to the GPU
gl.linkProgram(shaderProgram);
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
}

const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        cameraViewMatrix: gl.getUniformLocation(shaderProgram, 'uCameraViewMatrix'),
    }
};


/**
 * 
 * Draw the scene
 * 
 */

// Set the color used for the clear function
gl.clearColor(0, 0, 0, 1);

// Set the depth value used for the clear function 
gl.clearDepth(1.0);

// The enable function turns features on. 
// There is a complementary disable function to turn features off.
// Here depth testing is enablef
gl.enable(gl.DEPTH_TEST);

// Set the function used during the depth test. 
// Fragments that fail are not rendered.
// gl.NEVER (never pass)
// gl.LESS (pass if the incoming value is less than the depth buffer value)
// gl.EQUAL (pass if the incoming value equals the the depth buffer value)
// gl.LEQUAL (pass if the incoming value is less than or equal to the depth buffer value)
// gl.GREATER (pass if the incoming value is greater than the depth buffer value)
// gl.NOTEQUAL (pass if the incoming value is not equal to the depth buffer value)
// gl.GEQUAL (pass if the incoming value is greater than or equal to the depth buffer value)
// gl.ALWAYS (always pass)
gl.depthFunc(gl.LEQUAL);

// Do initial clear of the color and depth buffers
// Buffer types: Color, Depth, Stencil, etc
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// Create the projection matrix
// Using perspective projection 

// The field of view is an angle measured in Radians
// The ratio PI / 180 converts Degrees to Radians. 
// It comes from the fact: PI Radians = 180 Degrees
const fieldOfView = 45 * (Math.PI / 180);

// Set the aspect ratio of the projection
// It is defined as the ration Width / height
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

// Clipping distances.
// Fragments closer than 0.1 units to the camera will be ignored
// Fragments farther than 100.0 units away from the camera will be ignored
const zNear = 0.1;
const zFar = 100.0;

// Create a matrix object. Using a gl-matrix script for convenience
const projectionMatrix = mat4.create();
mat4.perspective(
    projectionMatrix,
    fieldOfView,
    aspect,
    zNear,
    zFar
);

const cameraViewMatrix = mat4.create();
// mat4.translate(cameraViewMatrix, cameraViewMatrix, [-1, -1, 10])
// mat4.rotateY(cameraViewMatrix, cameraViewMatrix, -Math.PI * 0.1 );
// mat4.rotateX(cameraViewMatrix, cameraViewMatrix, -Math.PI * 0.05 );
// mat4.invert(cameraViewMatrix, cameraViewMatrix);

// Create a matrix for the model(square)
const modelViewMatrix = mat4.create();

// Apply a translation to the matrix
mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);

{
    const numComponents = 2;  // (x, y) vs (x, y, z)
    const type = gl.FLOAT; // Number types: Byte, Short, Unsigned byte, Unsigned short, float
    const normalize = false; // Are the model vertices normalized? (-1, 1)
    const stride = 0; // The offset in bytes between bytes
    const offset = 0; // The start position

    // Tell the GPU to use the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the GPU how to read the array buffer 
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset
    );

    // Enable the feature
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition
    );
}

// Tell the GPU to use the shader program when drawing the geometry
gl.useProgram(programInfo.program);

// Set the projection matrix
gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
);

// Set the camera matrix
gl.uniformMatrix4fv(
    programInfo.uniformLocations.cameraViewMatrix,
    false,
    cameraViewMatrix
);


// Set the model matrix
gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
);

// Do the drawing
{
    const offset = 0;
    const vertexCount = 4;

    // Draw modes: 
    // gl.POINTS: Draws a single dot.
    // gl.LINE_STRIP: Draws a straight line to the next vertex.
    // gl.LINE_LOOP: Draws a straight line to the next vertex, and connects the last vertex back to the first.
    // gl.LINES: Draws a line between a pair of vertices.
    // gl.TRIANGLE_STRIP
    // gl.TRIANGLE_FAN
    // gl.TRIANGLES: Draws a triangle for a group of three vertices.
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
}