export function createXmbBackground(): () => void {
  let canvas: HTMLCanvasElement | null = null;
  let gl: WebGLRenderingContext | null = null;
  let animationFrameId: number | null = null;
  let shaderProgram: WebGLProgram | null = null;
  let vertexBuffer: WebGLBuffer | null = null;
  let timeUniformLocation: WebGLUniformLocation | null = null;
  let resolutionUniformLocation: WebGLUniformLocation | null = null;
  let needsResize = true;

  // Pre-allocate array for resolution to avoid garbage collection in render loop
  const resolutionArray = new Float32Array(2);

  const vertexShaderSource = `
attribute vec2 aVertexPosition;
void main() {
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
`;

  const fragmentShaderSource = `
precision highp float;

uniform float uTime;
uniform vec2  uResolution;

const float waveWidthFactor = 1.5;

vec3 calcSine(
    vec2 uv,
    float speed,
    float frequency,
    float amplitude,
    float phaseShift,
    float verticalOffset,
    vec3 baseColor,
    float lineWidth,
    float sharpness,
    bool invertFalloff
) {
    float angle = uTime * speed * frequency * -1.0 + (phaseShift + uv.x) * 2.0;
    float waveY = sin(angle) * amplitude + verticalOffset;
    float deltaY = waveY - uv.y;
    
    // OPTIMIZATION: Replaced distance() with abs(). 
    // distance() computes sqrt(x^2 + y^2), but since x-distance is 0, abs() is much faster.
    float distanceVal = abs(deltaY);

    // OPTIMIZATION: Replaced conditional branches (if/else) with branchless math.
    // GPUs execute shaders in lockstep; branching causes thread divergence which hurts performance.
    float deltaSign = step(0.0, deltaY); // 1.0 if deltaY >= 0.0, else 0.0
    float falloff = invertFalloff ? deltaSign : 1.0 - deltaSign;
    distanceVal *= 1.0 + falloff * 3.0; // Multiply by 4.0 if falloff is 1.0, else 1.0

    float smoothVal = smoothstep(lineWidth * waveWidthFactor, 0.0, distanceVal);
    float scaleVal  = pow(smoothVal, sharpness);
    return min(baseColor * scaleVal, baseColor);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 accumulatedColor = vec3(0.0);
    accumulatedColor += calcSine(uv, 0.2, 0.20, 0.2, 0.0, 0.5, vec3(0.3), 0.1, 15.0, false);
    accumulatedColor += calcSine(uv, 0.4, 0.40, 0.15, 0.0, 0.5, vec3(0.3), 0.1, 17.0, false);
    accumulatedColor += calcSine(uv, 0.3, 0.60, 0.15, 0.0, 0.5, vec3(0.3), 0.05, 23.0, false);
    accumulatedColor += calcSine(uv, 0.1, 0.26, 0.07, 0.0, 0.3, vec3(0.3), 0.1, 17.0, true);
    accumulatedColor += calcSine(uv, 0.3, 0.36, 0.07, 0.0, 0.3, vec3(0.3), 0.1, 17.0, true);
    accumulatedColor += calcSine(uv, 0.5, 0.46, 0.07, 0.0, 0.3, vec3(0.3), 0.05, 23.0, true);
    accumulatedColor += calcSine(uv, 0.2, 0.58, 0.05, 0.0, 0.3, vec3(0.3), 0.2, 15.0, true);

    // OPTIMIZATION: Replaced if-chain for max channel with built-in max()
    float maxChannel = max(accumulatedColor.r, max(accumulatedColor.g, accumulatedColor.b));
    if (maxChannel <= 0.0) discard;

    gl_FragColor = vec4(vec3(1.0), maxChannel * 1.5);
}
`;

  function compileShader(
    gl: WebGLRenderingContext,
    source: string,
    type: number,
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initWebGL(gl: WebGLRenderingContext) {
    const vs = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return false;

    const program = gl.createProgram();
    if (!program) return false;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // OPTIMIZATION: Detach and delete shaders after linking to free GPU memory
    gl.detachShader(program, vs);
    gl.deleteShader(vs);
    gl.detachShader(program, fs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return false;
    }

    gl.useProgram(program);
    shaderProgram = program;

    const posLoc = gl.getAttribLocation(program, "aVertexPosition");
    timeUniformLocation = gl.getUniformLocation(program, "uTime");
    resolutionUniformLocation = gl.getUniformLocation(program, "uResolution");

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // OPTIMIZATION: Set clear color once during initialization
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    return true;
  }

  function handleResize() {
    // OPTIMIZATION: Flag resize instead of executing immediately to prevent
    // layout thrashing on rapid resize events
    needsResize = true;
  }

  function renderFrame(timeMs: number) {
    if (
      !gl ||
      !shaderProgram ||
      !timeUniformLocation ||
      !resolutionUniformLocation ||
      !canvas
    )
      return;

    // Handle deferred resize
    if (needsResize) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      needsResize = false;
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(timeUniformLocation, timeMs * 0.001);

    // OPTIMIZATION: Use pre-allocated Float32Array to avoid per-frame object allocation
    resolutionArray[0] = canvas.width;
    resolutionArray[1] = canvas.height;
    gl.uniform2fv(resolutionUniformLocation, resolutionArray);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  // --- Initialization ---
  canvas = document.createElement("canvas");
  canvas.id = "xmb-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  gl = canvas.getContext("webgl", { alpha: true });
  if (!gl) {
    console.error("WebGL not supported");
    return () => {};
  }

  if (!initWebGL(gl)) {
    return () => {};
  }

  window.addEventListener("resize", handleResize);
  animationFrameId = requestAnimationFrame(renderFrame);

  // --- Cleanup Function ---
  return () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    window.removeEventListener("resize", handleResize);

    // OPTIMIZATION: Properly clean up WebGL resources to prevent memory leaks
    if (gl) {
      if (shaderProgram) gl.deleteProgram(shaderProgram);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      // Force context loss to release GPU resources immediately
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    }

    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    canvas = null;
    gl = null;
    shaderProgram = null;
    vertexBuffer = null;
  };
}
